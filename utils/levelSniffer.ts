import { StandardLevel } from '@/types/level';

export type GameMode = 'WAVE' | 'VASE' | 'IZM' | 'UNKNOWN';

export function detectGameMode(level: StandardLevel): GameMode {
    // 1. 最高优先级：遵循引擎定义的通关目标 (FinishMethod)
    if (level.FinishMethod) {
        const method = level.FinishMethod.toUpperCase();
        if (['WAVE', 'VASE', 'IZM', 'IZM2'].includes(method)) {
            return method.startsWith('IZM') ? 'IZM' : method as GameMode;
        }
    }

    // 2. 脏数据/无声明时的降级推测 (Fallback 推断)
    // 如果没有写 FinishMethod，就看哪家的数据是真的有货（而不是空的占位符）
    
    // 是否为砸罐子？(Vase或VaseFill有实际数组长度)
    const hasVase = level.VaseManager && 
        ((level.VaseManager.Vase?.length || 0) > 0 || (level.VaseManager.VaseFill?.length || 0) > 0);
    if (hasVase) return 'VASE';

    // 是否为我是僵尸？
    const hasIZM = !!level.IZMManager;
    if (hasIZM) return 'IZM';

    // 默认回推为标准塔防模式
    return 'WAVE';
}
