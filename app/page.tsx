"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    CloudLightning,
    Map as MapIcon,
    Skull,
    Sun,
    CloudFog,
    AlertTriangle,
    Sprout,
    Info,
    Wind,
    Search,
    MessageSquare
} from 'lucide-react';

// 假设这些在你的项目中已经定义好
import {
    StandardLevel,
    guessAndCastLevel,
    PacketBankConfig,
    SunManagerConfig,
    PreSpawnConfig,
    VaseManagerConfig,
    WaveManagerConfig
} from '@/types/level';
import { translatePvZ } from '@/utils/dict';

import { getGridSize, isWaterRow, LevelHeader, LevelTalk, SeedBankBoard, LawnGrid, WaveForecast, SearchBar, RadarZone } from '@/components/LevelShared';
import { detectGameMode } from '@/utils/levelSniffer';
import { WaveTemplate } from '@/components/templates/WaveTemplate';
import { VaseTemplate } from '@/components/templates/VaseTemplate';
import { IZMTemplate } from '@/components/templates/IZMTemplate';
import { getLevelFromCache, saveLevelToCache } from '@/utils/levelCache';

// ==========================================
// 主页面容器
// ==========================================

function LevelPreviewContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const urlId = searchParams.get('id');

    const [levelData, setLevelData] = useState<StandardLevel | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [searchSearched, setSearchSearched] = useState(false);
    const [metadataInfo, setMetadataInfo] = useState<any>(null);
    const [activeRadarZone, setActiveRadarZone] = useState<RadarZone>(null);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

    const isHeroMode = !levelData && !isLoading && !errorMsg;

    useEffect(() => {
        if (urlId) {
            fetchLevel(urlId);
        }
    }, [urlId]);

    // 监听全局快捷键 Ctrl+K 打开搜索面板
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchModalOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSearch = (id: string) => {
        setIsSearchModalOpen(false);
        router.push(`/?id=${id}`);
    };

    const fetchLevel = async (id: string) => {
        setIsLoading(true);
        setErrorMsg("");
        setSearchSearched(true);
        try {
            let data = await getLevelFromCache(id);

            if (!data) {
                const res = await fetch(`/api/level?id=${id}`);
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.error || "加载失败，请检查关卡 ID 是否存在 (API 报错)");
                }
                data = await res.json();
                if (data.error) throw new Error(data.error);

                await saveLevelToCache(id, data);
            }

            setMetadataInfo(data.metadata);

            const parsed = guessAndCastLevel(data.details);
            if (parsed && 'LevelName' in parsed) {
                const validLevel = parsed as StandardLevel;
                if (data.metadata?.name) {
                    validLevel.LevelName = data.metadata.name;
                }
                setLevelData(validLevel);
            } else {
                setErrorMsg("成功获取 JSON，但缺少必要的关卡字段结构，解析被拒绝。");
                setLevelData(null);
            }
        } catch (e: any) {
            setErrorMsg(e.message);
            setLevelData(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafbfc] flex justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-green-200">
            <div className="w-full flex flex-col gap-2 relative">

                {/* Hero态搜索栏 (仅在首页显示) */}
                {isHeroMode && (
                    <div className="w-full flex flex-col items-center pt-[15vh]">
                        <div className="flex flex-col items-center mb-10">
                            <div className="w-24 h-24 bg-green-100 rounded-[28px] flex items-center justify-center mb-6 shadow-sm -rotate-3 hover:rotate-0 transition-transform duration-300">
                                <MapIcon size={48} className="text-green-500" />
                            </div>
                            <h2 className="text-4xl sm:text-5xl font-black text-gray-800 tracking-tight mb-4">关卡 x-Ray 剖析</h2>
                            <span className="text-gray-500 font-medium text-lg">杂交版工坊全机制可视化工具</span>
                        </div>
                        
                        <SearchBar onSearch={handleSearch} loading={isLoading} initialValue={urlId || ""} mode="hero" />
                    </div>
                )}

                {/* Modal态命令面板 (预览页隐藏搜索，通过快捷键/FAB呼出) */}
                <SearchBar 
                    onSearch={handleSearch} 
                    loading={isLoading} 
                    initialValue={urlId || ""} 
                    mode="modal" 
                    isOpen={isSearchModalOpen}
                    onClose={() => setIsSearchModalOpen(false)}
                />

                {/* 右下角悬浮按钮 FAB */}
                {!isHeroMode && (
                    <button
                        onClick={() => setIsSearchModalOpen(true)}
                        className="fixed bottom-6 right-6 xl:bottom-8 xl:right-8 z-[90] w-16 h-16 bg-green-100 text-green-700 rounded-[24px] shadow-[0_8px_24px_-6px_rgba(34,197,94,0.4)] flex items-center justify-center hover:bg-green-200 hover:shadow-[0_12px_28px_-6px_rgba(34,197,94,0.5)] transition-all hover:-translate-y-1 active:scale-95 group border border-green-200/50"
                        title="搜索关卡 (Ctrl+K)"
                    >
                        <Search size={28} className="group-hover:scale-110 transition-transform duration-300" />
                        <span className="absolute -top-2.5 -right-2 bg-white text-gray-500 text-[10px] font-black px-1.5 py-0.5 rounded-lg shadow-sm border border-gray-100 uppercase pointer-events-none">
                            Ctrl+K
                        </span>
                    </button>
                )}

                {/* 错误态 */}
                {errorMsg && (
                    <div className={`w-full max-w-2xl mx-auto bg-rose-50 text-rose-600 px-6 py-4 rounded-2xl flex items-center justify-center gap-3 border border-rose-200 text-sm font-bold shadow-sm ${isHeroMode ? 'mt-8' : 'mb-6'}`}>
                        <AlertTriangle size={20} />
                        {errorMsg}
                    </div>
                )}

                {/* 加载态 */}
                {isLoading && (
                    <div className="flex-1 flex items-center justify-center pt-40">
                        <div className="animate-pulse flex flex-col items-center gap-5">
                            <div className="h-16 w-16 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
                            <span className="text-gray-400 font-bold tracking-widest text-sm uppercase">📡 正在拦截通讯信号...</span>
                        </div>
                    </div>
                )}

                {/* 主视区: 根据关卡类型路由 */}
                {!isLoading && levelData && !errorMsg && (() => {
                    const mode = detectGameMode(levelData);

                    switch (mode) {
                        case 'VASE':
                            return <VaseTemplate levelData={levelData} metadataInfo={metadataInfo} />;
                        case 'IZM':
                            return <IZMTemplate levelData={levelData} metadataInfo={metadataInfo} />;
                        case 'WAVE':
                        default:
                            return <WaveTemplate levelData={levelData} metadataInfo={metadataInfo} />;
                    }
                })()}
            </div>
        </div>
    );
}

export default function LevelPreviewPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">Loading...</div>}>
            <LevelPreviewContent />
        </Suspense>
    );
}
