"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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

// ==========================================
// 辅助方法区
// ==========================================

export function getGridSize(map: string): [number, number] {
    const mapLower = map.toLowerCase();
    let rows = 5;
    let cols = 9;

    if (mapLower.includes('pool') || mapLower.includes('backyard') || mapLower.includes('roof')) {
        rows = 6;
    }
    if (mapLower.includes('big')) {
        cols = 11;
        rows = 7;
    }
    return [cols, rows];
}

export function isWaterRow(map: string, rowIndex: number): boolean {
    const mapLower = map.toLowerCase();
    if (mapLower.includes('full')) {
        return true;
    }
    if (mapLower.includes('pool') || mapLower.includes('backyard')) {
        // 在大地图下，如果带水域结构可能会发生变化，但当前基于基础逻辑推断为正中间两行
        return rowIndex === 2 || rowIndex === 3;
    }
    return false;
}

// ==========================================
// 核心子组件区
// ==========================================

interface LevelHeaderProps {
    levelName: string;
    description: string;
    bgm: string;
    stormOpen: boolean;
}

export function LevelHeader({ levelName, description, bgm, stormOpen }: LevelHeaderProps) {
    return (
        <header className="flex flex-col gap-3">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {levelName || '未知关卡'}
            </h1>
            {description && (
                <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                    {description}
                </p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                    <span>🎵</span>
                    <span>BGM: {translatePvZ(bgm) || bgm}</span>
                </div>
                {stormOpen && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold">
                        <CloudLightning size={14} />
                        <span>雷暴天气</span>
                    </div>
                )}
            </div>
        </header>
    );
}

export function parseTalkText(data: any): string[] {
    const results: string[] = [];

    function search(obj: any) {
        if (!obj) return;
        if (typeof obj === 'string') {
            results.push(obj);
            return;
        }
        if (Array.isArray(obj)) {
            obj.forEach(search);
            return;
        }
        if (typeof obj === 'object') {
            if (typeof obj.Text === 'string') {
                results.push(obj.Text);
            } else {
                Object.values(obj).forEach(val => {
                    if (typeof val === 'object' || Array.isArray(val)) {
                        search(val);
                    }
                });
            }
        }
    }

    search(data);
    // 去重并过滤掉纯英文或者短的无意义系统ID
    return Array.from(new Set(results)).filter(text => text.trim().length > 0);
}

export function LevelTalk({ talk, tutorial }: { talk?: any, tutorial?: any }) {
    const messagesTalk = parseTalkText(talk);
    const messagesTutorial = parseTalkText(tutorial);
    const messages = [...messagesTalk, ...messagesTutorial];

    if (messages.length === 0) return null;

    return (
        <section className="w-full">
            <h2 className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
                <MessageSquare size={14} />
                开局寄语 / 教程
            </h2>
            <div className="bg-emerald-50/40 border border-emerald-100 rounded-[24px] p-5 flex flex-col gap-3 shadow-inner">
                {messages.map((msg, i) => (
                    <div key={i} className="text-gray-700 text-[14px] leading-relaxed bg-white border border-emerald-50 rounded-2xl p-4 shadow-sm relative whitespace-pre-wrap">
                        {/* 气泡小箭头装饰 */}
                        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-l border-b border-emerald-50 rotate-45"></div>
                        {msg}
                    </div>
                ))}
            </div>
        </section>
    );
}

interface SeedBankBoardProps {
    packetBank: PacketBankConfig;
    sunManager?: SunManagerConfig;
}

export function SeedBankBoard({ packetBank, sunManager }: SeedBankBoardProps) {
    const isConveyor = packetBank.Method === 'CONVEYOR';
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const [hoveredCard, setHoveredCard] = useState<{
        cardName: string;
        override: any;
        x: number;
        y: number;
    } | null>(null);

    return (
        <section className="w-full">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
                储备与卡牌限制
            </h2>
            <div className="bg-gray-50 rounded-[24px] flex flex-col md:flex-row items-center gap-4 overflow-hidden border border-gray-100">
                {/* 阳光区 */}
                <div className="flex flex-col items-center justify-center bg-orange-100/50 text-orange-600 p-6 min-w-[100px] h-full">
                    <Sun size={28} className="mb-1 drop-shadow-sm" />
                    <span className="text-2xl font-black">{sunManager?.Begin ?? 50}</span>
                </div>

                {/* 卡牌区 */}
                <div className="flex-1 w-full p-4 overflow-y-auto max-h-[160px] custom-scrollbar">
                    {isConveyor && packetBank.Method === 'CONVEYOR' ? (
                        <div className="flex items-center gap-3 min-w-max">
                            <span className="text-sm font-semibold text-gray-500 mr-2 flex items-center gap-1.5">
                                <Sprout size={16} />
                                传送带配置：
                            </span>
                            {packetBank.ConveyorPreset?.Packet.map((pkt, idx) => (
                                <div key={idx} className="px-3 py-1.5 flex flex-col items-center bg-white rounded-xl shadow-sm border border-gray-200 shrink-0">
                                    <span className="text-xs font-bold text-gray-800">
                                        {translatePvZ(pkt.Name)}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                                        权重 {pkt.Weight}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col justify-center h-full">
                            <div className="text-sm text-gray-600 font-medium flex items-center gap-2">
                                模式：<span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">{packetBank.Method}</span>
                            </div>
                            {packetBank.Value && packetBank.Value.length > 0 ? (
                                <div className="flex gap-2 mt-3 flex-wrap">
                                    {packetBank.Value.map((card, idx) => {
                                        const cardName = typeof card === 'string' ? card : card.PacketName;
                                        let override = typeof card !== 'string' ? card.Override : undefined;
                                        
                                        // 应对作者把事件塞入卡槽 Override 的黑魔法
                                        if (override?.EventName && override?.Value?.Override) {
                                            override = override.Value.Override;
                                        }
                                        
                                        const cost = override?.Cost;
                                        const cooldown = override?.PacketCooldown;
                                        const charOverride = override?.CharacterOverride;
                                        
                                        const isModified = !!override;
                                        const hpScale = charOverride?.HitpointScale;
                                        const propChange = charOverride?.PropertyChange;

                                        return (
                                            <div 
                                                key={idx} 
                                                className="relative group flex"
                                                onMouseEnter={(e) => {
                                                    if (!isModified) return;
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setHoveredCard({
                                                        cardName: typeof card === 'string' ? card : card.PacketName,
                                                        override,
                                                        x: rect.left + rect.width / 2,
                                                        y: rect.top
                                                    });
                                                }}
                                                onMouseLeave={() => setHoveredCard(null)}
                                            >
                                                <div className={`px-2.5 py-1 bg-white border rounded-lg shadow-sm text-xs font-semibold flex items-center gap-1 ${isModified ? 'cursor-help text-amber-800 border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors' : 'border-gray-200 text-gray-700'}`}>
                                                    {translatePvZ(cardName)}
                                                    
                                                    {/* 阳光与冷却标记 */}
                                                    {cost !== undefined && (
                                                        <span className="ml-1 px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-[9px] font-black border border-orange-200 leading-none flex items-center gap-0.5">
                                                            ☀️ {cost}
                                                        </span>
                                                    )}
                                                    {cooldown !== undefined && (
                                                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[9px] font-black border border-blue-200 leading-none flex items-center gap-0.5">
                                                            ⏱️ {cooldown}s
                                                        </span>
                                                    )}
                                                    {charOverride !== undefined && (
                                                        <span className="ml-0.5 text-[11px]" title="该卡牌基础属性被魔改">⚠️</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                    <Info size={12} />
                                    <span>自由选卡机制 (单格限制：{(packetBank as any).LimitGridPlantNum ?? '未知'} )</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 基于 Portal 的全局浮窗，免疫任何父组件遮挡 */}
            {mounted && hoveredCard && createPortal(
                (() => {
                    const { cardName, override, x, y } = hoveredCard;
                    const cost = override?.Cost;
                    const cooldown = override?.PacketCooldown;
                    const charOverride = override?.CharacterOverride;
                    const hpScale = charOverride?.HitpointScale;
                    const propChange = charOverride?.PropertyChange;
                    
                    const knownKeys = ['Cost', 'PacketCooldown', 'CharacterOverride'];
                    const unknownKeys = Object.keys(override || {}).filter(k => !knownKeys.includes(k));

                    return (
                        <div 
                            className="fixed z-[99999] pointer-events-none -translate-x-1/2 -translate-y-full pb-3 flex flex-col gap-1.5 min-w-max drop-shadow-2xl animate-in fade-in zoom-in duration-150"
                            style={{ left: x, top: y }}
                        >
                            <div className="bg-gray-900/95 text-white text-[11px] font-medium px-3 py-2 rounded-xl shadow-xl border border-gray-700 backdrop-blur-sm">
                                <div className="flex items-center gap-3 justify-between border-b border-gray-700/50 pb-1 mb-1.5">
                                    <span className="font-bold text-amber-400 text-[10px] uppercase tracking-wider drop-shadow-md">属性魔改明细</span>
                                    <span className="text-[11px] font-bold text-green-400">{translatePvZ(cardName)}</span>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    {cost !== undefined && <span className="flex items-center gap-1.5">阳光消耗: <span className="text-orange-400 font-bold px-1 bg-orange-500/20 rounded">☀️ {cost}</span></span>}
                                    {cooldown !== undefined && <span className="flex items-center gap-1.5">冷却时间: <span className="text-blue-400 font-bold px-1 bg-blue-500/20 rounded">⏱️ {cooldown}s</span></span>}
                                    {hpScale !== undefined && hpScale !== 1 && <span className="flex items-center gap-1.5">血量倍率: <span className="text-rose-400 font-bold">x{hpScale}</span></span>}
                                    {charOverride?.CanMowerMove !== undefined && <span className="flex items-center gap-1.5">可移动实体: <span className="text-cyan-400 font-bold">是</span></span>}
                                    {propChange && propChange.length > 0 && (
                                        <div className="mt-1 pt-1 border-t border-gray-700/50 flex flex-col gap-0.5">
                                            <span className="text-[9px] text-gray-400 mb-0.5">内部覆写参数：</span>
                                            {propChange.map((p: any, i: number) => (
                                                <span key={i} className="text-[10px]"><span className="opacity-60">{p.PropertyName}:</span> {String(p.Value)}</span>
                                            ))}
                                        </div>
                                    )}
                                    {unknownKeys.length > 0 && (
                                        <div className="mt-1 pt-1 border-t border-gray-700/50 flex flex-col gap-0.5 max-w-[240px]">
                                            <span className="text-[9px] text-gray-400 mb-0.5">其他修改项：</span>
                                            {unknownKeys.map(k => {
                                                const val = override[k];
                                                const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
                                                return (
                                                    <span key={k} className="text-[10px] break-all leading-snug">
                                                        <span className="opacity-60">{k}:</span> <span className="text-gray-300 line-clamp-3" title={strVal}>{strVal}</span>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {cost === undefined && cooldown === undefined && (hpScale === undefined || hpScale === 1) && charOverride?.CanMowerMove === undefined && (!propChange || propChange.length === 0) && unknownKeys.length === 0 && (
                                        <div className="mt-1 flex flex-col gap-0.5">
                                            <span className="text-[10px] text-gray-400 italic">仅包含空覆盖标记，无具体参数</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })(),
                document.body
            )}
        </section>
    );
}

export type RadarZone = { startCol: number, endCol: number, startRow: number, endRow: number } | null;

interface LawnGridProps {
    mapType: string;
    preSpawn?: PreSpawnConfig;
    vaseManager?: VaseManagerConfig;
    events?: any;
    waveManager?: WaveManagerConfig;
    activeRadarZone?: RadarZone;
    finishMethod?: string;
}

export function LawnGrid({ mapType = 'Frontlawn', preSpawn, vaseManager, events, waveManager, activeRadarZone, finishMethod }: LawnGridProps) {
    const [cols, rows] = useMemo(() => getGridSize(mapType), [mapType]);

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const [hoveredStack, setHoveredStack] = useState<{
        packets: any[];
        x: number;
        y: number;
        isStacked: boolean;
    } | null>(null);

    const groupedPreSpawn = useMemo(() => {
        if (!preSpawn?.Packet) return [];
        const groups = new Map<string, typeof preSpawn.Packet>();
        preSpawn.Packet.forEach(p => {
            const [col, row] = p.GridPos;
            if (!col || !row) return;
            const key = `${col}-${row}`;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(p);
        });
        return Array.from(groups.values());
    }, [preSpawn]);

    const specialLines = useMemo(() => {
        const linesMap = new Map<string, { type: 'warning' | 'stripe', col: number, waveDesc: Set<string> }>();
        const checkEvents = (evtArray: any[], waveDesc: string) => {
            evtArray?.forEach(evt => {
                let type: 'warning' | 'stripe' | null = null;
                if (evt.EventName === 'CurrentMapUseWarningLine') type = 'warning';
                else if (evt.EventName === 'CurrentMapUseStripe') type = 'stripe';

                if (type && evt.Value?.Row) {
                    const col = evt.Value.Row;
                    const key = `${type}-${col}`;
                    if (!linesMap.has(key)) {
                        linesMap.set(key, { type, col, waveDesc: new Set([waveDesc]) });
                    } else {
                        linesMap.get(key)!.waveDesc.add(waveDesc);
                    }
                }
            });
        };

        if (events?.EventInit) checkEvents(events.EventInit, '开局');
        if (events?.EventStart) checkEvents(events.EventStart, '开局');
        if (waveManager?.Wave) {
            waveManager.Wave.forEach((wave, idx) => {
                if (wave.Event) checkEvents(wave.Event, `第${idx + 1}波`);
            });
        }

        return Array.from(linesMap.values()).map(l => ({
            ...l,
            waveDesc: Array.from(l.waveDesc).join(', ')
        }));
    }, [events, waveManager]);

    const backgroundCells = Array.from({ length: rows }).flatMap((_, r) =>
        Array.from({ length: cols }).map((_, c) => ({
            row: r,
            col: c,
            isWater: isWaterRow(mapType, r),
            isLight: (r + c) % 2 === 0
        }))
    );

    return (
        <section className="w-full h-full flex flex-col items-center relative z-20">
            <div className="w-full flex items-center gap-2 mb-4 px-2">
                <MapIcon size={18} className="text-gray-400" />
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    沙盘预演视图 ({cols}x{rows})
                </h2>
            </div>

            <div
                className="w-full flex-1 relative bg-[#f4f7f4] p-2 sm:p-3 rounded-[24px] shadow-inner border border-gray-200/60"
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                    gap: '4px',
                    justifyContent: 'center',
                    alignContent: 'center'
                }}
            >
                {/* 1. 底板渲染 */}
                {backgroundCells.map((cell, idx) => (
                    <div
                        key={`bg-${idx}`}
                        className={`
                            rounded-xl transition-colors duration-500 shadow-sm
                            ${cell.isWater
                                ? 'bg-cyan-100/60 border border-cyan-200/50'
                                : cell.isLight
                                    ? 'bg-green-100/70'
                                    : 'bg-green-200/60'
                            }
                        `}
                        style={{
                            gridColumn: cell.col + 1,
                            gridRow: cell.row + 1,
                        }}
                    />
                ))}

                {/* 1.5 警戒线与种植线渲染 */}
                {specialLines.map((line, idx) => {
                    const isWarning = line.type === 'warning';
                    return (
                        <div
                            key={`line-${idx}`}
                            className={`
                                z-[5] w-3 sm:w-4 justify-self-end pointer-events-none opacity-90 h-full rounded-sm
                                translate-x-[calc(50%+2px)] relative
                                ${isWarning
                                    ? 'shadow-[0_0_10px_rgba(251,191,36,0.6)] border-x border-amber-600'
                                    : 'bg-red-600/80 border-x border-red-800 shadow-[0_0_15px_rgba(220,38,38,0.6)]'
                                }
                            `}
                            style={{
                                gridColumn: line.col, // json内指定的其实也就是列号 col (1-indexed)
                                gridRow: `1 / span ${rows}`,
                                background: isWarning ? 'repeating-linear-gradient(-45deg, #fbbf24, #fbbf24 10px, #000000 10px, #000000 20px)' : undefined
                            }}
                        >
                        </div>
                    );
                })}

                {/* 1.6 战术雷达覆盖区 */}
                {activeRadarZone && (
                    <div
                        className="z-[25] bg-red-500/20 border-2 border-dashed border-red-500 rounded-lg pointer-events-none animate-pulse flex items-center justify-center relative shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                        style={{
                            gridColumn: `${activeRadarZone.startCol} / ${activeRadarZone.endCol + 1}`,
                            gridRow: `${activeRadarZone.startRow} / ${activeRadarZone.endRow + 1}`
                        }}
                    >
                        <span className="text-2xl drop-shadow-md opacity-80">🎯</span>
                    </div>
                )}

                {/* 2. 预置生成实体 */}
                {groupedPreSpawn.map((packets, groupIdx) => {
                    const topPacket = packets[packets.length - 1]; // 默认取最后一个作为顶层显示
                    const [col, row] = topPacket.GridPos;
                    const isStacked = packets.length > 1;

                    // 顶层实体的属性
                    const override = topPacket.CharacterOverride;
                    const hpScale = override?.HitpointScale;
                    const canMowerMove = override?.CanMowerMove;
                    const propChange = override?.PropertyChange;
                    const hasAttack = propChange?.some(p => p.PropertyName === 'attack');
                    const hasFireInterval = propChange?.some(p => p.PropertyName === 'fireInterval');
                    const topTooltipText = propChange?.length ? propChange.map(p => `${p.PropertyName}: ${p.Value}`).join(', ') : null;

                    return (
                        <div
                            key={`pre-group-${groupIdx}`}
                            className="z-10 hover:z-[999] flex flex-col items-center justify-center p-1 cursor-pointer transition-transform hover:-translate-y-1.5 group relative min-w-0"
                            style={{ gridColumn: col, gridRow: row }}
                            onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoveredStack({
                                    packets,
                                    x: rect.left + rect.width / 2,
                                    y: rect.top,
                                    isStacked
                                });
                            }}
                            onMouseLeave={() => setHoveredStack(null)}
                        >
                            <div className={`w-11 h-11 rounded-[14px] bg-white shadow flex flex-col items-center justify-center mb-1.5 border group-hover:shadow-md transition-all relative ${isStacked ? 'border-amber-400 group-hover:border-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.3)]' : 'border-gray-200 group-hover:border-green-400'}`}>
                                {/* 堆叠阴影/卡牌层叠视觉效果 */}
                                {isStacked && (
                                    <>
                                        <div className="absolute -bottom-1 -right-1 w-full h-full rounded-[14px] border border-amber-300 bg-amber-50 z-[-1]"></div>
                                        <div className="absolute -bottom-2 -right-2 w-full h-full rounded-[14px] border border-amber-200 bg-amber-100/50 z-[-2]"></div>
                                        <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-sm z-20 ring-1 ring-white">
                                            {packets.length}
                                        </div>
                                    </>
                                )}

                                {hpScale && hpScale !== 1 && (
                                    <span 
                                        className="absolute -top-2 -left-2 bg-red-500 text-white text-[8px] font-black px-1 py-0.5 rounded shadow-sm z-20 whitespace-nowrap leading-none tracking-tighter"
                                        title={`HP 缩放: x${hpScale}`}
                                    >
                                        HP:{hpScale}
                                    </span>
                                )}
                                {(hasAttack || hasFireInterval || topTooltipText || canMowerMove) && (
                                    <div className="absolute -bottom-2 -left-2 flex gap-0.5 items-center bg-slate-800 rounded shadow-sm px-1 py-0.5 z-20 text-white whitespace-nowrap leading-none">
                                        {canMowerMove && <span className="text-[8px]" title="可移动实体">🔄</span>}
                                        {hasAttack && <span className="text-[8px]">⚔️</span>}
                                        {hasFireInterval && <span className="text-[8px]">⚡</span>}
                                        {!(hasAttack || hasFireInterval || canMowerMove) && topTooltipText && <span className="text-[8px]">🔧</span>}
                                    </div>
                                )}
                                <span className={`text-[10px] font-black ${isStacked ? 'text-amber-600' : 'text-green-600'}`}>Pre</span>
                            </div>
                            
                            <span className="text-[9px] leading-[1.1] font-semibold text-gray-800 bg-white/95 shadow-sm rounded px-1 py-0.5 line-clamp-2 break-all text-center w-full max-w-[5rem] backdrop-blur-sm z-10 relative">
                                {isStacked ? "多重实体" : translatePvZ(topPacket.Name)}
                            </span>
                        </div>
                    );
                })}

                {/* 3. 砸罐子模式实体 */}
                {vaseManager?.Vase?.map((vase, idx) => {
                    const [col, row] = vase.GridPos;
                    if (!col || !row) return null;

                    const isPlantVase = vase.Type === 'Plant';
                    const isNormalVase = vase.Type === 'Normal';

                    return (
                        <div
                            key={`vase-${idx}`}
                            className="z-20 flex flex-col items-center justify-center p-1 cursor-pointer transition-transform hover:z-50 hover:scale-110 group min-w-0"
                            style={{ gridColumn: col, gridRow: row }}
                            title={translatePvZ(vase.PacketName)}
                        >
                            <div className={`
                                w-11 h-[3.25rem] rounded-t-2xl rounded-b-lg shadow-md flex items-center justify-center border-2 backdrop-blur-md relative
                                ${isPlantVase ? 'bg-green-300/90 border-green-500' :
                                    isNormalVase ? 'bg-amber-200/90 border-amber-500' : 'bg-rose-300/90 border-rose-500'}
                            `}>
                                <span className="text-xl drop-shadow-sm opacity-80">🏺</span>
                            </div>

                            <span className="text-[9px] leading-[1.1] font-semibold text-gray-800 bg-white/95 shadow-sm rounded px-1 py-0.5 mt-1 border border-gray-200 line-clamp-2 break-all text-center w-full max-w-[5rem] z-10 pointer-events-none group-hover:bg-amber-50 transition-colors">
                                {translatePvZ(vase.PacketName)}
                            </span>
                        </div>
                    );
                })}

                {/* 4. 警戒线与种植线的顶层标签（防止被卡牌遮挡） */}
                {specialLines.map((line, idx) => {
                    if (!line.waveDesc || line.waveDesc === '开局') return null;
                    return (
                        <div
                            key={`line-label-${idx}`}
                            className="z-[30] pointer-events-none flex justify-center items-start"
                            style={{
                                gridColumn: line.col,
                                gridRow: 1,
                                transform: 'translateX(calc(50% + 2px)) translateY(-8px)'
                            }}
                        >
                            <div className="w-max px-1.5 py-0.5 rounded shadow-sm border text-[10px] font-black backdrop-blur-md bg-white/95 text-gray-800 border-gray-300 pointer-events-auto"
                                title={`触发时机: ${line.waveDesc}`}
                            >
                                {line.waveDesc}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 基于 Portal 的全局浮窗，免疫任何父组件遮挡 */}
            {mounted && hoveredStack && createPortal(
                <div 
                    className="fixed z-[99999] pointer-events-none -translate-x-1/2 -translate-y-full pb-3 flex flex-col-reverse gap-1.5 min-w-max drop-shadow-2xl animate-in fade-in zoom-in duration-150"
                    style={{ left: hoveredStack.x, top: hoveredStack.y }}
                >
                    {hoveredStack.packets.map((pkt, pIdx) => {
                        const pktOverride = pkt.CharacterOverride;
                        const pktProps = pktOverride?.PropertyChange;
                        const pktHp = pktOverride?.HitpointScale;
                        const pktCanMowerMove = pktOverride?.CanMowerMove;

                        return (
                            <div key={pIdx} className="bg-gray-900/95 text-white px-3 py-2 rounded-xl shadow-xl border border-gray-700 flex flex-col gap-1 relative backdrop-blur-sm">
                                <div className="flex items-center gap-2 justify-between border-b border-gray-700/50 pb-1 mb-0.5">
                                    <span className="text-[11px] font-bold text-green-400">
                                        {translatePvZ(pkt.Name)}
                                    </span>
                                    {hoveredStack.isStacked && (
                                        <span className="text-[9px] font-black text-gray-400 bg-gray-800 px-1 rounded">
                                            层级 {pIdx + 1}
                                        </span>
                                    )}
                                </div>

                                {pktHp && pktHp !== 1 && (
                                    <span className="text-[10px] text-rose-400 font-bold">
                                        HP 缩放: x{pktHp}
                                    </span>
                                )}

                                {pktCanMowerMove && (
                                    <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1">
                                        <span>🔄</span> 可手动移动实体
                                    </span>
                                )}

                                {pktProps && pktProps.length > 0 && (
                                    <div className="flex flex-col gap-0.5 mt-0.5">
                                        <span className="text-[9px] text-amber-500 font-bold uppercase">Overrides:</span>
                                        {pktProps.map((p: any, i: number) => (
                                            <span key={i} className="text-[10px] text-gray-300">
                                                <span className="opacity-70">{p.PropertyName}:</span> {String(p.Value)}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {(!pktHp || pktHp === 1) && (!pktProps || pktProps.length === 0) && !pktCanMowerMove && (
                                    <span className="text-[10px] text-gray-400 italic">无额外属性</span>
                                )}
                            </div>
                        );
                    })}
                </div>,
                document.body
            )}
        </section>
    );
}

interface WaveForecastProps {
    waveManager: WaveManagerConfig;
    setActiveRadarZone?: (zone: RadarZone) => void;
}

export function WaveForecast({ waveManager, setActiveRadarZone }: WaveForecastProps) {
    const totalWaves = waveManager.Wave?.length || 0;
    const isEndless = !!waveManager.Dynamic && waveManager.Dynamic.length > 0;
    const flagInterval = waveManager.FlagWaveInterval || 10;

    return (
        <aside className="w-full flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-6 shrink-0">
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-gray-900">
                    <Skull className="text-rose-500" />
                    波次时间轴
                </h2>
                <div className="flex items-center gap-2 text-[13px] font-bold bg-gray-100/80 text-gray-600 px-3 py-1 rounded-full tracking-wider">
                    {isEndless ? '包含无尽池' : `共 ${totalWaves} 波`}
                </div>
            </div>

            <div className="flex-1 pr-4 pl-1">
                <div className="relative border-l-2 border-gray-200 ml-2 space-y-6 pb-6 pt-2">
                    {waveManager.Wave?.map((wave, index) => {
                        const waveNumber = index + 1;
                        const isFlagWave = waveNumber % flagInterval === 0;
                        const spawns = wave.Spawn || [];
                        const bungiSpawns = wave.Event?.filter(evt => evt.EventName === 'BungiSpawnZombie') || [];
                        const gravestoneEvents = wave.Event?.filter(evt => evt.EventName === 'GravestoneCreateRandom') || [];
                        const tipsPlayEvents = wave.Event?.filter(evt => evt.EventName === 'TipsPlay') || [];
                        const isEmpty = spawns.length === 0 && bungiSpawns.length === 0 && gravestoneEvents.length === 0 && tipsPlayEvents.length === 0;

                        return (
                            <div key={index} className="relative pl-6">
                                {/* 时间轴定位节点 */}
                                <div className={`
                                    absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-[3px] bg-white transition-colors duration-300
                                    ${isFlagWave ? 'border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : isEmpty ? 'border-gray-200' : 'border-gray-400'}
                                `}></div>

                                <div className="flex flex-col">
                                    <div className="flex items-center gap-3 leading-none">
                                        <span className={`text-[15px] font-black tracking-tight ${isFlagWave ? 'text-rose-600' : 'text-gray-800'}`}>
                                            第 {waveNumber} 波
                                        </span>
                                        {isFlagWave && (
                                            <span className="text-[11px] font-extrabold bg-rose-100/80 text-rose-700 px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm mt-[-2px]">
                                                <span>🚩</span> 一大波僵尸
                                            </span>
                                        )}
                                    </div>

                                    <div className={`mt-3 ${isEmpty ? 'opacity-50' : ''}`}>
                                        {isEmpty ? (
                                            <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5 italic">
                                                <Info size={14} /> 无僵尸出场
                                            </span>
                                        ) : (
                                            <div className="flex flex-col gap-3">
                                                {tipsPlayEvents.length > 0 && (
                                                    <div className="flex flex-col gap-2 w-full mb-1">
                                                        {tipsPlayEvents.map((tip, tIdx) => (
                                                            <div key={`tip-${tIdx}`} className="bg-yellow-50 border border-yellow-200/80 rounded-xl p-3 flex items-start gap-2.5 shadow-sm relative overflow-hidden">
                                                                <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-400"></div>
                                                                <span className="text-lg shrink-0 mt-px select-none">📢</span>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-black text-yellow-600/80 uppercase tracking-widest mb-0.5 select-none">
                                                                        作者提示
                                                                    </span>
                                                                    <span className="text-[13px] font-bold text-yellow-900 leading-snug">
                                                                        {tip.Value?.Text || "未知文字内容"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {spawns.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {spawns.map((spawn, sIdx) => {
                                                            const name = spawn.Zombie;
                                                            if (!name) return null;
                                                            const override = spawn.Override;
                                                            const hpScale = override?.HitpointScale;
                                                            const speedScale = override?.WalkSpeedScale;
                                                            const isFast = Array.isArray(speedScale) ? speedScale[0] > 1.5 : (typeof speedScale === 'number' && speedScale > 1.5);
                                                            const propChange = override?.PropertyChange;
                                                            const tooltipText = propChange?.length ? propChange.map(p => `${p.PropertyName}: ${p.Value}`).join(', ') : null;

                                                            return (
                                                                <div key={sIdx} className="relative group flex hover:z-50">
                                                                    <span
                                                                        className={`px-3 py-1.5 shadow-sm rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 cursor-default
                                                                            ${isFlagWave ? 'bg-rose-50/50 border-rose-200 text-rose-800' : 'bg-white border-gray-200 text-gray-700'}
                                                                            ${tooltipText ? 'cursor-help' : ''}
                                                                        `}
                                                                    >
                                                                        {translatePvZ(name)}
                                                                        {spawn.Num > 1 && (
                                                                            <span className="ml-1 opacity-70 font-semibold bg-black/5 px-1.5 py-0.5 rounded-md text-[10px]">
                                                                                x{spawn.Num}
                                                                            </span>
                                                                        )}
                                                                        {hpScale && hpScale > 1 && (
                                                                            <span className="ml-1 text-[9px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded shadow-sm">
                                                                                Boss级血量: x{hpScale}
                                                                            </span>
                                                                        )}
                                                                        {isFast && (
                                                                            <span className="ml-1 text-[9px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded shadow-sm">
                                                                                极速
                                                                            </span>
                                                                        )}
                                                                        {tooltipText && !hpScale && !isFast && (
                                                                            <span className="ml-0.5 text-[11px] opacity-80" title="该实体被修改了属性">🔧</span>
                                                                        )}
                                                                    </span>

                                                                    {/* Tooltip */}
                                                                    {tooltipText && (
                                                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 min-w-max bg-gray-900/95 text-white text-[11px] font-medium px-3 py-2 rounded-xl shadow-xl border border-gray-700">
                                                                            <div className="font-bold text-amber-400 mb-1 text-[10px] uppercase tracking-wider drop-shadow-md">Property Overrides</div>
                                                                            <div className="flex flex-col gap-0.5">
                                                                                {propChange!.map((p, i) => (
                                                                                    <span key={i}><span className="opacity-60">{p.PropertyName}:</span> {String(p.Value)}</span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {bungiSpawns.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {bungiSpawns.map((bungiEvent, bIdx) => {
                                                            const val = bungiEvent.Value || {};
                                                            const rawNames = val.ZombieNames || [];
                                                            const names = Array.isArray(rawNames) ? rawNames : [rawNames];
                                                            const num = val.ZombieNum || 1;
                                                            const override = val.Override;
                                                            const hpScale = override?.HitpointScale;
                                                            const speedScale = override?.WalkSpeedScale;
                                                            const isFast = Array.isArray(speedScale) ? speedScale[0] > 1.5 : (typeof speedScale === 'number' && speedScale > 1.5);
                                                            const propChange = override?.PropertyChange;
                                                            const tooltipText = propChange?.length ? propChange.map((p: any) => `${p.PropertyName}: ${p.Value}`).join(', ') : null;

                                                            return names.map((name: string, nIdx: number) => (
                                                                <div key={`bungi-${bIdx}-${nIdx}`} className="relative group flex hover:z-50"
                                                                    onMouseEnter={() => {
                                                                        if (setActiveRadarZone && val.SpawnPos) {
                                                                            setActiveRadarZone({
                                                                                startCol: val.SpawnPos.x,
                                                                                endCol: val.SpawnPos.z,
                                                                                startRow: val.SpawnPos.y,
                                                                                endRow: val.SpawnPos.w
                                                                            });
                                                                        }
                                                                    }}
                                                                    onMouseLeave={() => setActiveRadarZone && setActiveRadarZone(null)}
                                                                >
                                                                    <span
                                                                        className={`px-3 py-1.5 shadow-sm rounded-xl text-xs font-bold transition-all flex items-center gap-1 border
                                                                            ${setActiveRadarZone && val.SpawnPos ? 'cursor-pointer hover:ring-2 hover:ring-red-500' : 'cursor-default'}
                                                                            bg-orange-50/80 border-orange-200 text-orange-800
                                                                            ${tooltipText ? 'cursor-help' : ''}
                                                                        `}
                                                                    >
                                                                        <span className="text-[12px]">🪂</span> 空投突袭：{translatePvZ(name)}
                                                                        {num > 1 && (
                                                                            <span className="ml-1 opacity-70 font-semibold bg-black/5 mx-0.5 px-1.5 py-0.5 rounded-md text-[10px]">
                                                                                x{num}
                                                                            </span>
                                                                        )}
                                                                        {hpScale && hpScale > 1 && (
                                                                            <span className="ml-1 text-[9px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded shadow-sm">
                                                                                Boss级血量: x{hpScale}
                                                                            </span>
                                                                        )}
                                                                        {isFast && (
                                                                            <span className="ml-1 text-[9px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded shadow-sm">
                                                                                极速
                                                                            </span>
                                                                        )}
                                                                        {tooltipText && !hpScale && !isFast && (
                                                                            <span className="ml-0.5 text-[11px] opacity-80" title="该实体被修改了属性">🔧</span>
                                                                        )}
                                                                    </span>

                                                                    {/* Tooltip */}
                                                                    {tooltipText && (
                                                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 min-w-max bg-gray-900/95 text-white text-[11px] font-medium px-3 py-2 rounded-xl shadow-xl border border-gray-700">
                                                                            <div className="font-bold text-amber-400 mb-1 text-[10px] uppercase tracking-wider drop-shadow-md">Property Overrides</div>
                                                                            <div className="flex flex-col gap-0.5">
                                                                                {propChange!.map((p: any, i: number) => (
                                                                                    <span key={i}><span className="opacity-60">{p.PropertyName}:</span> {String(p.Value)}</span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ));
                                                        })}
                                                    </div>
                                                )}

                                                {gravestoneEvents.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {gravestoneEvents.map((grave, gIdx) => {
                                                            const val = grave.Value || {};
                                                            const names = val.GravestoneNames || [];
                                                            const num = val.GravestoneNum || 1;
                                                            const isBungiSteal = names.includes("ZombieBungi");

                                                            if (isBungiSteal) {
                                                                return (
                                                                    <div key={`grave-${gIdx}`} className="relative group flex hover:z-50"
                                                                        onMouseEnter={() => {
                                                                            if (setActiveRadarZone && val.GravestonePos) {
                                                                                setActiveRadarZone({
                                                                                    startCol: val.GravestonePos.x,
                                                                                    endCol: val.GravestonePos.z,
                                                                                    startRow: val.GravestonePos.y,
                                                                                    endRow: val.GravestonePos.w
                                                                                });
                                                                            }
                                                                        }}
                                                                        onMouseLeave={() => setActiveRadarZone && setActiveRadarZone(null)}
                                                                    >
                                                                        <span className={`px-3 py-1.5 shadow-sm rounded-xl text-xs font-bold border transition-all flex items-center gap-1 bg-purple-50/80 border-purple-200 text-purple-800 ${setActiveRadarZone && val.GravestonePos ? 'cursor-pointer hover:ring-2 hover:ring-red-500' : 'cursor-default'}`}>
                                                                            <span className="text-[12px]">🛸</span> 飞贼突袭：从天而降偷取 {num} 株植物
                                                                        </span>
                                                                    </div>
                                                                );
                                                            } else {
                                                                return (
                                                                    <div key={`grave-${gIdx}`} className="relative group flex hover:z-50">
                                                                        <span className="px-3 py-1.5 shadow-sm rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 cursor-default bg-gray-100 border-gray-200 text-gray-600">
                                                                            <span className="text-[12px]">🪦</span> 墓碑掉落：{num} 块
                                                                        </span>
                                                                    </div>
                                                                );
                                                            }
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {totalWaves === 0 && (
                        <div className="text-sm font-bold text-gray-400 pl-6 flex items-center gap-2 py-4">
                            <Info size={16} /> 这关没有静态打表波次
                        </div>
                    )}

                    {(() => {
                        const validDynamics = (waveManager.Dynamic || []).filter(
                            stage => Object.keys(stage).length > 0 && stage.ZombiePool && stage.ZombiePool.length > 0
                        );

                        if (!isEndless || validDynamics.length === 0) return null;

                        return (
                            <div className="relative pl-6 pt-4">
                                <div className="absolute -left-[9px] top-5 w-4 h-4 rounded-full border-[3px] bg-white border-indigo-400"></div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-[15px] font-black tracking-tight text-indigo-600">
                                        动态阶段 / 随机池
                                    </span>
                                    <div className="mt-2 text-xs font-medium text-gray-500 bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl leading-relaxed flex flex-col gap-2">
                                        {validDynamics.map((stage, i) => (
                                            <div key={i} className="flex gap-2 items-start">
                                                {stage.StartingWave !== undefined && (
                                                    <span className="text-indigo-700 font-bold bg-indigo-100/60 px-2 py-0.5 rounded whitespace-nowrap">
                                                        第 {stage.StartingWave} 波起
                                                    </span>
                                                )}
                                                <span className="text-gray-600 leading-tight">
                                                    {(stage.ZombiePool || []).map(z => translatePvZ(z)).join('、') || '暂无数据'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </aside>
    );
}

// 顶部搜索组件（支持 Hero 与 Modal 命令面板两种形态）
interface SearchBarProps {
    onSearch: (id: string) => void;
    loading: boolean;
    initialValue?: string;
    mode?: "hero" | "modal";
    isOpen?: boolean;
    onClose?: () => void;
}

export function SearchBar({ onSearch, loading, initialValue = "", mode = "hero", isOpen = true, onClose }: SearchBarProps) {
    const [inputValue, setInputValue] = useState(initialValue);
    const [history, setHistory] = useState<string[]>([]);
    const inputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        setInputValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        const stored = localStorage.getItem("pvz_search_history");
        if (stored) {
            try {
                setHistory(JSON.parse(stored));
            } catch (e) {}
        }
    }, []);

    useEffect(() => {
        if (mode === 'modal' && isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [mode, isOpen]);

    useEffect(() => {
        if (mode === 'modal' && isOpen) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    onClose?.();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [mode, isOpen, onClose]);

    const handleSearch = (id: string) => {
        const trimmed = id.trim();
        if (!trimmed) return;
        
        let newHistory = [trimmed, ...history.filter(h => h !== trimmed)].slice(0, 30);
        setHistory(newHistory);
        localStorage.setItem("pvz_search_history", JSON.stringify(newHistory));
        
        onSearch(trimmed);
    };

    const innerContent = (
        <div className={`w-full flex flex-col ${mode === 'hero' ? 'max-w-3xl' : ''}`}>
            <div className={`flex w-full items-center bg-white border overflow-hidden pl-5 pr-2 py-2 hover:shadow-md transition-shadow
                ${mode === 'modal' ? 'rounded-[24px] shadow-sm mb-6 h-16 border-gray-200' : 'rounded-full shadow-md mb-8 h-16 border-gray-100'}`}>
                <Search className="text-gray-400 shrink-0 mr-3" size={24} />
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearch(inputValue);
                    }}
                    placeholder="输入工坊关卡 ID (例: 3245)"
                    className="flex-1 outline-none text-gray-800 bg-transparent text-lg sm:text-xl font-medium placeholder:text-gray-300"
                />
                <button
                    onClick={() => handleSearch(inputValue)}
                    disabled={loading || !inputValue.trim()}
                    className="ml-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white px-6 py-2.5 rounded-full text-sm sm:text-base font-bold transition-colors shrink-0 shadow-sm"
                >
                    {loading ? "检索中..." : "加载"}
                </button>
            </div>
            
            {history.length > 0 && (
                <div className="w-full flex flex-col gap-4 px-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-extrabold tracking-widest uppercase">搜索历史</span>
                        <button
                            onClick={() => { setHistory([]); localStorage.removeItem("pvz_search_history"); }}
                            className="text-gray-400 hover:text-rose-500 text-[10px] uppercase font-bold transition-colors"
                        >
                            清空全部
                        </button>
                    </div>
                    
                    <div className={`flex flex-wrap gap-2.5 ${mode === 'modal' ? 'max-h-[350px] overflow-y-auto custom-scrollbar pr-2 pb-2' : ''}`}>
                        {history.map((hId) => (
                            <button
                                key={hId}
                                onClick={() => { setInputValue(hId); handleSearch(hId); }}
                                className="px-4 py-2 bg-gray-50 hover:bg-green-50 hover:text-green-700 text-gray-600 hover:border-green-200 text-sm font-semibold rounded-xl border border-gray-200 transition-colors shadow-sm"
                            >
                                {hId}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    if (mode === 'modal') {
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
                
                <div className="relative w-full max-w-2xl bg-[#f8fafc] rounded-[32px] shadow-[0_24px_48px_rgba(0,0,0,0.2)] p-6 sm:p-8 animate-in zoom-in-95 slide-in-from-top-4 duration-300">
                    <div className="absolute top-4 right-6 text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded shadow-sm">ESC 关闭</div>
                    {innerContent}
                </div>
            </div>
        );
    }

    // Hero 模式
    return (
        <div className="w-full flex flex-col items-center">
            {innerContent}
        </div>
    );
}

// ==========================================

// 砸罐子模式专属右侧资源池面板
export function VasePoolPanel({ vaseManager }: { vaseManager: any | undefined }) {
    if (!vaseManager) return null;

    const allVases = [...(vaseManager.Vase || []), ...(vaseManager.VaseFill || [])];
    if (allVases.length === 0) return null;

    const plantVases = allVases.filter(v => v.PacketName?.startsWith('Plant'));
    const zombieVases = allVases.filter(v => v.PacketName?.startsWith('Zombie'));
    const otherVases = allVases.filter(v => v.PacketName && !v.PacketName.startsWith('Plant') && !v.PacketName.startsWith('Zombie'));

    const plantCount = plantVases.length;
    const zombieCount = zombieVases.length;
    const otherCount = otherVases.length;

    const plantNames = Array.from(new Set(plantVases.map(v => translatePvZ(v.PacketName))));
    const zombieNames = Array.from(new Set(zombieVases.map(v => translatePvZ(v.PacketName))));
    const otherNames = Array.from(new Set(otherVases.map(v => translatePvZ(v.PacketName))));

    return (
        <div className="w-full flex flex-col gap-4 bg-gradient-to-br from-amber-50 to-orange-50/30 border border-amber-200/50 rounded-[24px] p-6 lg:p-7 shadow-sm">
            <div className="flex items-center gap-4 border-b border-amber-200/60 pb-4">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-amber-100 flex items-center justify-center shrink-0">
                    <span className="text-3xl drop-shadow-sm">🏺</span>
                </div>
                <div className="flex flex-col">
                    <h2 className="text-lg font-black text-amber-900 tracking-tight">砸罐子资源池</h2>
                    <span className="text-[11px] text-amber-700/80 font-bold bg-amber-100/50 px-2 py-0.5 rounded w-fit mt-1 border border-amber-200/50">
                        {vaseManager.Shuffle ? '🎲 罐子内含物开局已打乱' : '📌 罐子内容为固定位置分布'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="flex flex-col items-center bg-white/60 border border-green-200/60 rounded-2xl p-3 shadow-sm hover:bg-white transition-colors">
                    <span className="text-2xl mb-1">🌿</span>
                    <span className="text-3xl font-black text-green-600 leading-none">{plantCount}</span>
                    <span className="text-[10px] font-black text-green-700/60 mt-1 uppercase tracking-wider">植物罐</span>
                </div>
                <div className="flex flex-col items-center bg-white/60 border border-rose-200/60 rounded-2xl p-3 shadow-sm hover:bg-white transition-colors">
                    <span className="text-2xl mb-1">🧟</span>
                    <span className="text-3xl font-black text-rose-600 leading-none">{zombieCount}</span>
                    <span className="text-[10px] font-black text-rose-700/60 mt-1 uppercase tracking-wider">僵尸罐</span>
                </div>
            </div>

            {otherCount > 0 && (
                <div className="flex items-center justify-between bg-purple-50/80 border border-purple-200/60 rounded-xl px-4 py-2.5 shadow-sm">
                    <span className="text-xs font-bold text-purple-800 flex items-center gap-1.5"><span className="text-sm">✨</span> 特殊道具/事件</span>
                    <span className="text-base font-black text-purple-700">{otherCount}</span>
                </div>
            )}

            <div className="flex flex-col gap-5 mt-2">
                {plantNames.length > 0 && (
                    <div className="flex flex-col gap-2.5">
                        <span className="text-xs font-black text-green-800 flex items-center gap-1.5 opacity-80 uppercase tracking-widest">
                            <span className="w-1 h-3 bg-green-500 rounded-full"></span> 包含植物
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {plantNames.map(name => (
                                <span key={name} className="text-[11px] font-bold bg-white text-green-800 px-2.5 py-1 rounded-lg border border-green-200 shadow-sm">{name}</span>
                            ))}
                        </div>
                    </div>
                )}
                
                {zombieNames.length > 0 && (
                    <div className="flex flex-col gap-2.5">
                        <span className="text-xs font-black text-rose-800 flex items-center gap-1.5 opacity-80 uppercase tracking-widest">
                            <span className="w-1 h-3 bg-rose-500 rounded-full"></span> 包含僵尸
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {zombieNames.map(name => (
                                <span key={name} className="text-[11px] font-bold bg-white text-rose-800 px-2.5 py-1 rounded-lg border border-rose-200 shadow-sm">{name}</span>
                            ))}
                        </div>
                    </div>
                )}

                {otherNames.length > 0 && (
                    <div className="flex flex-col gap-2.5">
                        <span className="text-xs font-black text-purple-800 flex items-center gap-1.5 opacity-80 uppercase tracking-widest">
                            <span className="w-1 h-3 bg-purple-500 rounded-full"></span> 特殊内容物
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {otherNames.map(name => (
                                <span key={name} className="text-[11px] font-bold bg-white text-purple-800 px-2.5 py-1 rounded-lg border border-purple-200 shadow-sm">{name}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
