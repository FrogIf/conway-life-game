# 康威生命游戏(Conway's Game of Life)

规则:

1. 生存规则: 如果一个细胞周围有2或者3个活细胞, 则该细胞在下一代中继续存活;
2. 死亡规则: 如果一个细胞周围少于2个活细胞(孤独), 或者超过3个活细胞(过度拥挤), 则该细胞在下一代中死亡;
3. 出生规则: 如果一个死细胞周围正好有3个活细胞, 则该细胞在下一代中变为活细胞;

> 紧邻的斜对角也是邻居, 即每个点有8个邻居