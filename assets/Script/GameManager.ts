import { _decorator, CCInteger, Component, instantiate, Label, math, Node, Prefab, Vec3 } from 'cc';
import { BLOCK_SIZE, PlayerController } from './PlayerController';
const { ccclass, property } = _decorator;


enum BlockType{
    BT_NONE, // 空地块
    BT_STONE, //  石头地块
};

/**
 * GS_INIT 时我们先显示 StartMenu、创建地图以及重设角色的为和状态并禁用角色输入
 * GS_PLAYING：在状态下隐藏 StartMenu、重设计步器的数值以及启用用户输入
 */

enum GameState{
    GS_INIT,
    GS_PLAYING,
    GS_END,
};


@ccclass('GameManager')
export class GameManager extends Component {

    // public 这个会外显给gameManager,可以用来绑定对应的元素
    @property({type: Prefab})
    public boxPrefab: Prefab|null = null;
    @property({type: CCInteger})
    public roadLength: number = 50; // 路长度
    private _road: BlockType[] = []; // 路的数组

    @property({ type: Node }) // 开始菜单
    public startMenu: Node | null = null;
    @property({ type: PlayerController }) // 角色控制器(角色实例本身)
    public playerCtrl: PlayerController | null = null;
    @property({type: Label})  // 屏幕右上角的步数显示
    public stepsLabel: Label|null = null;

    start() {
        this.setCurState(GameState.GS_INIT); // 第一初始化要在 start 里面调用
        this.playerCtrl?.node.on('JumpEnd', this.onPlayerJumpEnd, this);
    }

    // 初始化状态
    init() {
        if (this.startMenu) {
            // 开启菜单
            this.startMenu.active = true;
        }

        // 生成随机道路
        this.generateRoad();

        if (this.playerCtrl) {
            // 关闭鼠标点击事件
            this.playerCtrl.setInputActive(false);
            // 设置为原点
            this.playerCtrl.node.setPosition(Vec3.ZERO);
            this.playerCtrl.reset();
        }
    }

    // 状态流转
    setCurState(value: GameState) {
        switch (value) {
            case GameState.GS_INIT:
                this.init();
                break;
            case GameState.GS_PLAYING:
                // 隐藏开始菜单
                if (this.startMenu) {
                    this.startMenu.active = false;
                }

                if (this.stepsLabel) {
                    this.stepsLabel.string = '步数：0';   // 将步数重置为0
                }

                //直接设置active会直接开始监听鼠标事件，导致点play的那下也算，做了一下延迟处理
                setTimeout(() => {
                    if (this.playerCtrl) {
                        this.playerCtrl.setInputActive(true);
                    }
                }, 0.1);
                break;
            case GameState.GS_END:
                break;
        }
    }

    // 生成下方的道路
    generateRoad() {
        this.node.removeAllChildren();

        this._road = [];
        // 起点有石头
        this._road.push(BlockType.BT_STONE);

        for (let i = 1; i < this.roadLength; i++) {
            if (this._road[i - 1] === BlockType.BT_NONE) { // 如果上一个是空地块，那么这个地块就是石头
                this._road.push(BlockType.BT_STONE);
            } else {
                this._road.push(Math.floor(Math.random() * 2)); // 如果上一块有石头，随机生成一个有石头的地块|空地块
            }
        }

        for (let j = 0; j < this._road.length; j++) {
            let block: Node | null = this.spawnBlockByType(this._road[j]);
            if (block) {
                this.node.addChild(block);
                block.setPosition(j * BLOCK_SIZE, 0, 0);
            }
        }
    }

    // 通过 spawnBlockByType 来生成新的方块并将它通过 setPosition 方法放置到合适的位置。
    spawnBlockByType(type: BlockType) {
        if (!this.boxPrefab) {
            return null;
        }

        let block: Node|null = null;
        switch(type) {
            case BlockType.BT_STONE:
                block = instantiate(this.boxPrefab);
                break;
        }
        return block;
    }

    // 点击开始玩
    onStartButtonClicked() {
        this.setCurState(GameState.GS_PLAYING);
    }

    // 增加一个用于判定角色是否跳跃到坑或者跳完所有地块的方法
    checkResult(moveIndex: number) {
        if (moveIndex < this.roadLength) {
            if (this._road[moveIndex] == BlockType.BT_NONE) {   //跳到了空方块上

                this.setCurState(GameState.GS_INIT)
            }
        } else {    // 跳过了最大长度
            this.setCurState(GameState.GS_INIT);
        }
    }

    onPlayerJumpEnd(moveIndex: number) {
        if (this.stepsLabel) {
            this.stepsLabel.string = '步数：' + (moveIndex >= this.roadLength ? this.roadLength : moveIndex);
        }
        this.checkResult(moveIndex);
    }
}