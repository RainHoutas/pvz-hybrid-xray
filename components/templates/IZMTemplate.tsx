"use client";

import React from 'react';
import { CloudFog, AlertTriangle, Wind, Brain } from 'lucide-react';
import { StandardLevel } from '@/types/level';
import { LevelHeader, LevelTalk, SeedBankBoard, LawnGrid } from '@/components/LevelShared';

interface IZMTemplateProps {
    levelData: StandardLevel;
    metadataInfo?: any;
}

export function IZMTemplate({ levelData, metadataInfo }: IZMTemplateProps) {
    return (
        <div className="w-full flex flex-col xl:grid xl:grid-cols-[22.5rem_minmax(0,1fr)] gap-4 lg:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-2 xl:h-[calc(100vh-6rem)]">
            
            {/* 左侧：基本信息与特殊环境 */}
            <aside className="flex flex-col bg-white shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 rounded-[20px] lg:rounded-[24px] p-6 xl:overflow-y-auto min-h-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                <div className="flex flex-col gap-6 h-full">
                    <LevelHeader
                        levelName={levelData.LevelName}
                        description={levelData.Description}
                        bgm={levelData.BGM}
                        stormOpen={levelData.StormOpen}
                    />
                    {metadataInfo && metadataInfo.author && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-[-1rem] font-medium bg-gray-50 p-2 rounded-xl border border-gray-100 w-fit">
                            <span className="bg-gray-200 px-2 py-0.5 rounded text-gray-700 font-bold text-xs uppercase">作者</span>
                            {metadataInfo.author}
                        </div>
                    )}
                    <LevelTalk talk={levelData.Talk} tutorial={levelData.Tutorial} />

                    <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-5 flex flex-col gap-3 mt-4">
                        <h3 className="text-blue-800 font-extrabold flex items-center gap-2">
                            <Wind size={20} />
                            特殊环境修正
                        </h3>
                        <ul className="text-sm font-medium text-blue-900/70 space-y-3">
                            {levelData.FogManager?.Open ? (
                                <li className="flex items-center gap-2">
                                    <CloudFog size={16} /> 从第 {levelData.FogManager.BeginColumn} 列起出现大雾
                                </li>
                            ) : (
                                <li className="flex items-center gap-2 opacity-50">视野清晰，无迷雾</li>
                            )}

                            {levelData.MowerUse === false ? (
                                <li className="flex items-center gap-2 text-rose-600">
                                    <AlertTriangle size={16} /> 致命危机：无安全小推车保护！
                                </li>
                            ) : (
                                <li className="flex items-center gap-2 opacity-50">具备安全小推车。</li>
                            )}
                        </ul>
                    </div>
                </div>
            </aside>

            {/* 右侧：核心区域 (沙盘与卡牌) */}
            <main className="flex flex-col min-w-0 bg-white shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 rounded-[20px] lg:rounded-[24px] p-6 xl:overflow-y-auto min-h-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                <div className="flex flex-col gap-6 h-full">
                    <SeedBankBoard
                        packetBank={levelData.PacketBank}
                        sunManager={levelData.SunManager}
                    />
                    <div className="mt-2 flex-1 min-h-[25rem] flex flex-col">
                        <LawnGrid
                            mapType={levelData.Map}
                            preSpawn={levelData.PreSpawn}
                            events={levelData.Event}
                            finishMethod="IZM"
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
