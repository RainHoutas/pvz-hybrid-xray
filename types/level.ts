/**
 * 植物大战僵尸杂交版关卡配置架构定义 (混合官方源码提取与前端探针分析)
 * 核心架构、枚举与键名严格以最新提取的游戏源码为准。
 * 结合了前端渲染所需的衍生类型与 Discriminated Unions 辨识联合类型优化。
 */

// ====================== 基础衍生类型别名 ======================

/** 
 * UI 渲染辅助类型
 */
export type PlantName = string;
export type ZombieName = string;

/**
 * 网格坐标。
 * 格式为 [Col, Row]，即 GridPos[0] 为列号，GridPos[1] 为行号。
 * 坐标均以 1 为起始值（1-indexed）。
 * 说明: 部分包含大地图（如 "Big" 结尾）的关卡，其可种植行数可达 7~11 行。
 */
export type GridPosition = [number, number];

// ====================== 核心动作与事件类型 ======================

export interface EventAction {
    EventName: string;                 // 事件类名（如 "MapChange", "SunChange", "GravestoneCreateRandom" 等）
    Value?: Record<string, any> & {    // 事件参数（不同的事件拥有不同的参数结构）
        ZombieNames?: string[] | string; // 降落伞/空投僵尸事件专属：空投的僵尸代号或代号列表
        ZombieNum?: number;            // 降落伞/空投僵尸事件专属：空投数量
        Override?: CharacterOverride | PacketOverride; // 魔改属性
        Delay?: number[] | number;     // 降落伞/空投僵尸事件/墓碑事件专属：延迟时间
        GravestoneNames?: string[] | string; // 墓碑/随机物体降落事件专属
        GravestoneNum?: number;        // 墓碑/随机物体降落数量
        GravestonePos?: { w: number, x: number, y: number, z: number }; // 墓碑/随机物体降落的范围
        SpawnPos?: { w: number, x: number, y: number, z: number };      // 空投僵尸的降落范围
        Text?: string;                 // TipsPlay事件专属: 提示文本
        Duration?: number;             // TipsPlay事件专属: 持续时间
        MapName?: string;              // MapChange事件专属: 切换的地图名称
        Row?: number;                  // 警戒线/红线限制事件专属: 影响的列或行
        FunctionName?: string;         // CurrentMapFunctionExecute事件专属: 地图行为名称
        Name?: string;                 // AddPacket事件专属: 追加的卡牌
        Weight?: number;               // AddPacket事件专属: 卡牌权重
        MaxNum?: number;               // AddPacket事件专属: 数量上限
        MaxMagnification?: number;     // AddPacket事件专属: 上限权重倍率
        MinNum?: number;               // AddPacket事件专属: 数量下限
        MinMagnification?: number;     // AddPacket事件专属: 下限权重倍率
        GameMode?: string;             // SetGameMode事件专属: 改变模式
        Shape?: string;                // CreateProtal事件专属: 传送门样式
        ChangeTime?: number;           // CreateProtal事件专属: 变幻时间
        PosRange?: { w: number, x: number, y: number, z: number }; // CreateProtal事件专属: 生成区域
        Num?: number;                  // SunCreate/CheckCharacterNum/CheckSunCollect事件专属: 数值
        DieCreate?: boolean;           // SunCreate事件专属: 死亡生成
        FromPacket?: boolean;          // SunCreate事件专属: 是否继承卡牌
        FromPacketPercentage?: number; // SunCreate事件专属: 继承倍率
        PacketName?: string;           // ChangePacket事件专属: 卡牌名称
        CharacterName?: string;        // CheckCharacterNum事件专属: 实体名称
        Method?: string;               // CheckCharacterNum事件专属: 比较方式
    };
}

// ====================== 卡牌/实体覆盖配置 ======================

/**
 * 角色/实体覆盖配置 (CharacterOverride / Override)。
 * 能够完全改写游戏内实体的基础属性。
 */
export interface CharacterOverride {
    CanMowerMove?: boolean;
    HitpointScale?: number;
    WalkSpeedScale?: [number, number] | number[];
    PropertyChange?: Array<{
        PropertyName: string;          // 例如 "fireInterval", "fireNum", "sunNum", "projectileName"
        Value: string | number | boolean;
    }>;
    AnimeSpeedScale?: [number, number];
    Scale?: number;
    SpawnEvent?: EventAction[];        // 出生时执行的事件
    DieEvent?: EventAction[];          // 死亡时执行的事件
    [key: string]: any;
}

/**
 * 种子卡牌覆盖配置 (PacketOverride)。
 */
export interface PacketOverride {
    Cost?: number;                     // 购买/种植费用
    CostRise?: number;                 // 每次种植后费用递增量
    PacketCooldown?: number;           // 自定义冷却时间（秒）
    Type?: string;                     // 卡牌品质: "Star" | "Diamond" | "Gold" 等
    CharacterOverride?: CharacterOverride;
    EventPlant?: EventAction[];        // 种植时触发的事件
    PlantCover?: string[];             // 叠加种植要求覆盖的底层植物（针对"坚果壳"之类）
    CoverCanDirectPlant?: boolean;     // 底部可否直接种植
    [key: string]: any;
}

// ====================== 各大子系统管理器配置 ======================

export interface RewardConfig {
    RewardType: "NOONE" | "PACKET" | "COLLECTABLE" | "COIN" | "TROPHY";
    RewardFirst: number | string;      // 首次通关奖励值 (金币数量或物品代号/包名)
}

export interface EventManagerConfig {
    EventInit?: EventAction[];         // 关卡初始化事件
    EventReady?: EventAction[];        // 关卡就绪事件
    EventStart?: EventAction[];        // 关卡开始事件
}

export interface PreSpawnPacket {
    Name: PlantName | ZombieName;      // 预种植实体的 saveKey (如 "Peashooter")
    GridPos: GridPosition;             // 具体所处的网格
    CharacterOverride?: CharacterOverride; // 初始特殊状态 (如隐身、放大等)
}

export interface PreSpawnConfig {
    Packet?: PreSpawnPacket[];
}

export interface ConveyorPresetConfig {
    Type: "Default" | "Sun" | string;
    Interval: number;                  // 传送带出卡基础间隔(秒)
    IntervalIncreaseEvery: number;
    IntervalMagnification: number;
    Packet: Array<{
        Name: PlantName | ZombieName;
        Weight: number;                // 抽出概率权重
        MaxMagnification?: number;
        MaxNum?: number;               // 传送带内存在的最大数量
        MinMagnification?: number;
        MinNum?: number;
        Override?: PacketOverride;
    }>;
    WaveEvent?: EventAction[];         // 达到特定波次时促发的发卡逻辑或动画
}

export interface RainPresetConfig {
    Type: "Default" | "Sun" | string;
    AliveTime: number;                 // 种子雨落地后的自动存活(消失)时间(秒)
    Interval: number;                  // 种子降落间隔(秒)
    Packet: Array<{
        Name: PlantName | ZombieName;
        Weight: number;
        MaxMagnification?: number;
        MaxNum?: number;
        MinMagnification?: number;
        MinNum?: number;
    }>;
}

// ------------------- Packet Bank（种子栏）鉴别联合类型 -------------------

export interface BasePacketBank {
    LimitGridPlantNum: number;         // 每格最大植物数，-1 = 不限
    PlantColumn: boolean;              // 是否限制只能种植在特定列
    ColdDownUse: boolean;              // 是否启用卡片冷却机制
    ColdDownStart: boolean;            // 开局是否均处于初始冷却中
    Type: string;                      // packet bank 种类，如 "GeneralPlant", "GeneralZombie"
    Value?: Array<string | {           // 卡牌预设配置池（针对自选或直接配给卡片）
        PacketName: string;
        Override?: PacketOverride;
    }>;
}

export interface ConveyorPacketBank extends BasePacketBank {
    Method: "CONVEYOR";
    ConveyorPreset: ConveyorPresetConfig; // 传送带专属配置
}

export interface RainPacketBank extends BasePacketBank {
    Method: "RAIN";
    RainPreset: RainPresetConfig;      // 种子雨专属配置
}

export interface StandardPacketBank extends BasePacketBank {
    Method: "CHOOSE" | "PRESET" | "NOONE";
}

/**
 * 种子栏辨识联合类型 (Discriminated Union)，自动推导与 Method 匹配的从属配置。
 */
export type PacketBankConfig = ConveyorPacketBank | RainPacketBank | StandardPacketBank;

// ------------------- 环境组件与辅助系统 -------------------

export interface SunManagerConfig {
    Open: boolean;                     // 是否启用天上掉落阳光循环
    Type: string;                      // 掉落物的特性，如 "Normal"
    Begin: number;                     // 初始自带阳光
    SpawnInterval: number;             // 掉落时间间隔(秒)
    SpawnNum: number;                  // 每次掉落的具体阳光值数量
    MovingMethod: "LAND" | "GRAVITY" | "MOVING";
}

export interface FogManagerConfig {
    Open: boolean;                     // 是否启用浓雾系统
    BeginColumn: number;               // 雾气从第几列开始蔓延
}

export interface LookStarManagerConfig {
    Open: boolean;                     // 观星(看星星)谜题判定是否开启
    Check: Array<{                     // 判定规则数组
        PacketName: PlantName;
        GridPos: GridPosition;
    }>;
}

// ------------------- 胜利模式绑定管理器 -------------------

export interface ZombieSpawnItem {
    Zombie: ZombieName;                // 僵尸 saveKey
    Line: number;                      // 出怪行，-1 = 随机行，1-N 为确切行
    Num: number;                       // 堆叠同格出怪数量
    Override?: CharacterOverride;      // 僵尸个体的具体强化弱化覆盖
    SpawnEvent?: EventAction[];        // 僵尸出生时的特殊回调
    DieEvent?: EventAction[];          // 僵尸死亡掉落等回调
}

export interface WaveInstanceConfig {
    DynamicPlantfood?: number[];       // 此波僵尸掉落肥料的分布序列
    Spawn?: ZombieSpawnItem[];         // 固定的确切出怪列表
    Dynamic?: {                        // 积分制动态选派随机生成出怪
        Point: number;                 // 当波的预算积分
        ZombiePool: ZombieName[];      // 抽卡的僵尸池
    };
    Event?: EventAction[];             // 达到此波时调用的所有场景/天气/系统事件
}

export interface WaveDynamicStage {
    PointIncrementPerWave: number;     // 随波次自然递增的积分数
    StartingPoints: number;            // 该阶段起步时的积分
    StartingWave: number;              // 从第几波起算此规则（阶段划分）
    ZombiePool: ZombieName[];          // 阶段可随机池
}

export interface WaveManagerConfig {
    ZombieInvisible: boolean;          // 是否全局隐身僵尸
    FlagZombieUse: boolean;            // 是否包含出旗帜僵尸
    FlagZombie: string;                // 指定的摇旗僵尸 key
    FlagWaveInterval: number;          // 每隔几波出一次大旗
    MaxNextWaveHealthPercentage: number;  // 当前波存活血量剩余的上限阈值触发新波次
    MinNextWaveHealthPercentage: number;  // 下限阈值
    BeginCol: number;                  // 出兵渲染计算列 (默认约 20.0，在右外边距)
    SpawnColStart: number;             // 随机散布列区间起点
    SpawnColEnd: number;               // 随机散布区间终点
    
    SpawnOverride?: CharacterOverride; // 全局覆盖波次中所有出生僵尸基底属性
    
    Dynamic?: WaveDynamicStage[];      // 积分阶段规划表（无尽/动态模式使用）
    Wave: WaveInstanceConfig[];        // 具体静态打表波次组合
    Survival?: string | Record<string, any>; // 生存/无尽逻辑入口拓展
}

export interface VaseManagerConfig {
    Shuffle: boolean;                  // 是否在游戏开始时把随机池打乱打散
    Vase: Array<{
        PacketName: string;            // 砸开出的植物或僵尸种类
        Type: "Normal" | "Plant" | "Zombie"; // 模型预置的表皮样式
        GridPos: GridPosition;         // 这个罐子的精确放置点
        Override?: PacketOverride;
    }>;
    VaseFill: Array<{                  // 随机散播池的内容占比
        PacketName: string;
        Override?: PacketOverride;
    }>;
}

export interface IZMManagerConfig {
    Shuffle: boolean;                  // 是否随机打乱预置僵尸位置
}

// ====================== 主关卡数据模型 ======================

/**
 * 官方标准关卡配置实体 Schema, 反射了底层的 TowerDefenseLevelConfig
 */
export interface StandardLevel {
    // ----------------- 基础信息 -----------------
    LevelName: string;
    LevelNumber: number;               // -1 表示非正式关卡序列
    Description: string;

    // ---------------- 世界/模式设置 ---------------
    HomeWorld: "NOONE" | "MORDEN";
    FinishMethod: "WAVE" | "VASE" | "IZM" | "QUIZ" | "IZM2";

    // ---------------- 对话/教程交互 ---------------
    Talk?: string | Record<string, any>;
    Tutorial?: string | Record<string, any>;

    // --------------- 地图/音效/基本天气 -------------
    Map: string;                       // 地图 key ("Frontlawn", "Pool", "Roof" 等)
    BGM: string;
    MowerUse: boolean;                 // 是否具备安全割草机
    StormOpen: boolean;                // 是否开启定期闪光打雷的天气干扰

    // ------------------ 通关反馈 -----------------
    Reward?: RewardConfig;

    // ------------------ 节点事件 -----------------
    Event?: EventManagerConfig;

    // ------------------ 预初始化 -----------------
    PreSpawn?: PreSpawnConfig;

    // ----------------- 发牌槽系统 -----------------
    PacketBank: PacketBankConfig;

    // ----------------- 子环境系统 -----------------
    SunManager?: SunManagerConfig;
    FogManager?: FogManagerConfig;
    LookStarManager?: LookStarManagerConfig;

    // ----------- 驱动玩法的核心模式 (不共融) ----------
    // WAVE / IZM2
    WaveManager?: WaveManagerConfig;
    // VASE
    VaseManager?: VaseManagerConfig;
    // IZM
    IZMManager?: IZMManagerConfig;

    // 兜底捕捉自定义扩展数据或其他不确定的 Godot 运行时附加词条
    [key: string]: any;
}

/**
 * 格式高度不符合现行标准导致无法断言的极特殊关卡数据承载类型
 */
export interface UnknownLevel {
    [key: string]: any;
}

/**
 * 前端渲染与解析管道中统一通用的联合类型
 */
export type PvZLevel = StandardLevel | UnknownLevel;

/**
 * 关卡推断工具：根据数据特征尽可能向带有严格全类型检测的 StandardLevel 断言转换。
 */
export function guessAndCastLevel(rawData: any): PvZLevel {
    if (rawData && rawData.PacketBank && typeof rawData.PacketBank.Method === 'string') {
        return rawData as StandardLevel;
    }
    return rawData as UnknownLevel;
}
