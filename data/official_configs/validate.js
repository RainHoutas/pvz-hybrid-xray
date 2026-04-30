/* 工具函数定义 */

const Util = {
    isObject: value => typeof value === 'object' && value !== null && !Array.isArray(value),
    asArray: value => Array.isArray(value) ? value : [],
    combineAsArray: (...args) => {
        return args.reduce((total, current) => {
            const normalized = Util.asArray(current);
            return total.concat(normalized);
        }, []);
    },
    collectEvents: data => [
        ...Util.combineAsArray(data.Event?.EventInit, data.Event?.EventReady, data.Event?.EventStart),
        ...Util.asArray(data.PacketBank?.ConveyorPreset?.WaveEvent).flat(),
        ...Util.asArray(data.WaveManager?.Wave).map(wave => Util.asArray(wave.Event)).flat()
    ],
    collectOverrides: data => [
        ...Util.combineAsArray(
            data.PacketBank?.Value,
            data.PacketBank?.RainPreset?.Packet,
            data.PacketBank?.ConveyorPreset?.Packet,
            data.PacketBank?.ConveyorPreset?.PacketPrioritySpawnList
        ).filter(item => Util.isObject(item.Override)).map(item => item.Override),
        ...(Util.isObject(data.WaveManager?.SpawnOverride) ? [data.WaveManager?.SpawnOverride] : []),
        ...Util.asArray(data.PreSpawn?.Packet).filter(item => Util.isObject(item.CharacterOverride)).map(item => item.CharacterOverride),
        ...Util.asArray(data.VaseManager?.Vase).filter(item => Util.isObject(item.Override?.CharacterOverride)).map(item => item.Override.CharacterOverride),
        ...Util.asArray(data.WaveManager?.Wave).map(wave => Util.combineAsArray(wave.Spawn, wave.GridSpawn)).flat().filter(item => Util.isObject(item.Override)).map(item => item.Override)
    ]
}

/** @type {import('./validate').ValidateRule[]} */

// ------------------------------ 校验主结构开始 ------------------------------

export default [
    /* 统计类:文本信息类检测 */
    data => {
        let texts = [
            data.LevelName,
            data.Description,
            ...Util.asArray(data.Talk?.Talk).map(item => item?.Text),
            ...Util.asArray(data.Tutorial?.Step).map(item => item?.BroadCast?.Text),
            ...Util.collectEvents(data).map(event => event.EventName === 'TipsPlay' && event.Value?.Text)
        ];
        Dialog.tags(
            [...new Set(texts.filter(item => typeof item === 'string'))],
            '关卡中出现的文本'
        );
    },
    /* 分析:空波次检测 */
    (data, prompt) => {
        if (data.FinishMethod !== 'IZM2' && data.FinishMethod !== 'Wave') {
            return;
        }
        // 获取波次数组
        let emptyWaveCount = 0;
        const waves = data.WaveManager.Wave;
        for (let i = 0; i < waves.length; i++) {
            // 遍历波次数组
            const wave = waves[i];
            !(
                (wave?.GridSpawn?.length > 0) ||
                (wave?.Spawn?.length > 0) ||
                (wave?.Dynamic?.ZombiePool?.length > 0) ||
                (wave?.Event?.length > 0)
            ) && emptyWaveCount++;
        }
        emptyWaveCount > 0 && prompt.warn(`波次配置：存在 ${emptyWaveCount} 个空波次, 共 ${waves.length} 波`);
    }
];

// ------------------------------ 校验主结构结束 ------------------------------