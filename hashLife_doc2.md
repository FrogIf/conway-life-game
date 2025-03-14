译自: [HashLife](https://www.dev-mind.blog/hashlife/)

技术支持: 通义千问

# HashLife

## 介绍

在这篇帖子中，我将介绍我所遇到过的最神奇的算法之一：HashLife。不过，我不太敢直接称它为“最神奇的算法”，因为它涉及另一件我觉得绝对不可思议的事物——生命游戏（Game of Life，简称GoL）。简而言之，HashLife是一种算法，它可以将生命游戏的计算速度提升数千倍、数百万倍，甚至数十亿倍，实际上，只要你有足够的资源，它可以加速到你所需要的任何程度。和往常一样，源代码可以在[GitHub](https://github.com/ngmsoftware/hashlife)上获取。

我写这篇帖子稍微有点“晚”，因为自从几年前我接触到这个算法以来，我一直想实现它，但从未有时间完全理解它。我是在一个叫 Golly 的软件中第一次遇到它的，Golly 是一个用于编辑、构建和模拟生命游戏（Game of Life）模式的程序。在使用 Golly 之前，我已经有了自己的生命游戏实现版本，但那是基于一种非常慢的朴素方法。因此，我对生命游戏的真实潜力并不了解，因为大型模式需要花费极长时间才能演化并展现出令人震惊的行为。

但在 Golly 中，我可以打开一些预先设计的巨大模式——非常庞大的模式！当我点击播放时，正如预期的那样，它们仍然需要很长时间来演化。然而，界面上有一个带有闪电图标的小按钮。当我们点击它时，神奇的事情发生了！仅仅几秒钟后，这些模式瞬间跳过了几十代、几百代、几千代，有时甚至是几百万代——这一切都在毫秒之间完成！！！

你可能会猜到，当我们将鼠标悬停在这个按钮上时，会出现一个小提示标签：Hashlife。从那之后，我不断在网上搜索这个神奇的词，并发现它是一种令人惊叹的算法，这让生命游戏对我来说变得更加神奇！

在过去的这些年里，我时不时地会花几个小时试图理解这个算法，但每次都因为觉得它太复杂而放弃。在那些尝试的过程中，我偶然发现了几篇关于该算法的文章（除了原始论文之外）。其中有一篇对我理解这个算法特别有帮助，那就是 Tomas G. Rokicki 写的《一种压缩空间和时间的算法》([An Algorithm for Compressing Space and Time
](https://www.drdobbs.com/jvm/an-algorithm-for-compressing-space-and-t/184406478))。他看起来是一个非常非常聪明的人，我非常喜欢他的文章。后来我才知道，他实际上是 Golly 的作者之一（这并不令人意外 😅）。

他的文章肯定比我的这篇文章好得多！我甚至不敢尝试超越他的作品。不过，我会试着提供更多关于这个算法如何工作的细节，可能只是因为我打算加入更多图片并对此多做一些解释 😅。尽管如此，如果你真的想深入了解这个神奇的算法，你应该去阅读他的文章。另一个重要之处在于，他在文章中已经涵盖了我想说的所有内容，比如算法如何通过哈希机制加速时间、四叉树如何实现空间压缩等。甚至他的标题也是你能想到的最好的！所以，非常感谢罗基奇博士写出了这样一篇精彩的文章。

正如我提到的，我会尝试在这篇文章中提供更多的细节。此外，我将试着遵循我认为在尝试实现 Hashlife 算法时的直观思维过程。这将不可避免地导致一些死胡同，而这在我们试图实现一个非直观的算法时是正常的。我希望通过展示我的思考过程，能够对你理解和实现你自己的版本有所帮助，并且具有足够的教学意义。

## 生命游戏(Game of Life)

如果不解释什么是生命游戏（GoL），那么解释哈希生命（HashLife）就没有意义了。毕竟，HashLife 是一种用于加速生命游戏的算法。

生命游戏（Game of Life）其实并不是一个游戏 😅（至少不是这个词在通常意义上的意思）。它是约翰·康威（John Conway）发明的一种构造，涉及一个无限的方格网格和几条规则。从技术上讲，生命游戏是一种自动机（automaton）。

在这个“游戏”中，网格中的每个方格都是一个细胞，它可以有两种状态：“死亡”或“存活”。规则决定了这些细胞随着时间的推移（以离散步骤进行）会发生什么。在每个时间步长中，细胞只能保持原状或改变状态。因此，一个死亡的细胞可以继续保持死亡状态或复活，而一个存活的细胞可以继续保持存活状态或死亡。这些行为完全由规则决定。就是这样，生命游戏本质上是这个网格随着时间的演化。在每一步中，网格中的所有细胞都会根据规则进行检测，并可能改变状态或保持不变。在传统的生命游戏中，规则非常简单：

* 任何有两个或三个活邻居的活细胞将会存活。  
* 任何有三个活邻居的死细胞会变成活细胞。  
* 所有其他活细胞将在下一代中死亡。同样，所有其他死细胞保持死亡状态。

是的，只有 3 条规则。你从一个完全由死细胞组成的无限网格开始，手动改变一些细胞的状态，形成某种活细胞的图案。然后你在该网格上启动生命游戏（GoL），观察细胞如何“演化”。网上有很多生命游戏模拟器，你可以用它们“绘制”自己的图案，并观看其演化的动画。实际上，你可以很容易地通过固定网格的大小（比如 1000 x 1000）并实现一个循环来创建自己的生命游戏动画，在每一步中，遍历网格中的所有细胞，测试每条规则并在必要时应用变化。或者，如果你想尝试的话，可以在下图/小程序中动手试试……

<image src="img/2_1.png" width="800px" >

> 原文这里是一个可执行的html小程序

如果你以前从未听说过生命游戏（GoL），你可能会疑惑：这东西到底有什么值得人们感兴趣的呢？！如果没有 HashLife，这个问题的答案可能不会那么令人信服。首先，即使没有 HashLife，你也至少可以理解为什么它被称为“生命”。如果你在网格中画一个随机图案并让它演化几步（顺便提一下，步骤通常被称为“代”），你会注意到细胞表现出一种类似“生命”的行为。仅这一点就足以让我在过去感到惊叹。通过如此简单的规则，你已经能看到一些会振荡、滑动或演化的图案。此外，如果你精心设计初始图案，还可以看到复杂的结构，比如“枪”（生成其他图案的图案）、“喷气机”（发射随机细胞的图案）等。所有这些都源自那三条看似简单的规则。正如我所说，到目前为止，你并不需要 HashLife。通过一个朴素的“网格扫描”实现，你就可以观察到这些行为，持续数百甚至数千代。

围绕生命游戏有一个完整的社区。有些人甚至将其用于纯数学领域的严肃研究。实际上，还有一本名为“生命词典”（[Life Lexicon](https://bitstorm.org/gameoflife/lexicon/)）的词典，用来命名标准的图案。正如我之前提到的，生命游戏的技术术语是“自动机”（Automata）。计算机科学和数学领域的人们对此进行了大量研究。例如，我们可以改变规则并研究由此产生的新特性。

## HashLife

正如我之前所说，HashLife 是一种加速生命游戏（GoL）计算的算法。特别的是，它允许我们跳过许多代，并在一步中演化网格数千甚至数百万代。同时，它还以非常高效的内存表示形式来实现这一点。因此，本质上，它是一种压缩空间和时间的算法（正如罗基奇博士的伟大文章标题中已经提到的那样 😄）。不过，HashLife 算法并非由罗基奇博士发明，而是由一位名叫威廉·高斯珀（William Gosper）的人创建，并于 1984 年在《Physica 10D》上发表了一篇名为《Exploiting Regularities in Large Cellular Spaces》的论文。遗憾的是，比尔·高斯珀（他更为人熟知的名字）并没有为广泛的受众撰写这篇论文。这是一篇物理学论文，因此关于算法本身的细节很少，仅仅提到了一些核心思想。但幸运的是，这些内容已经足够让人们实现该算法，并使其在某种程度上变得“著名”（尽管能够详细解释该算法的文章可能屈指可数）。

那么，如何将计算速度提升一百万倍呢？更重要的是，如何不仅在时间上，还在空间上实现这种加速？这就是比尔·高斯珀的论文最有用的地方，因为他在标题中就已经给出了关键：**“Exploiting Regularities in Large Cellular Spaces”**（利用大型细胞空间中的规律性）。这里的重点是 **“规律性”**。

我们将从算法的两个方面来看待它：空间和时间。这里的关键概念是 **“四叉树”**（用于空间）和 **“哈希”**（用于时间）。为了更好地解释该算法为何能如此高效（并且占用极小的内存空间），我认为首先需要证明在生命游戏中确实可以做到这一点。在接下来的部分中，我们将分别探讨空间和时间这两个方面。

## 空间压缩

这是两个方面中较容易理解的一个。为了证明可以实现极大的压缩，我们可以举一个简单的例子。我们可以通过仅用大小和内容“0”（1000, 1000, 0）来表示一个空的1000×1000网格，这样，用3个数字就可以表示一个包含一百万个点的网格。

当然，这是一个过于极端的简单例子。正如我之前提到的，这里的关键词是“四叉树”。四叉树的工作原理是从一个边长为2的幂次的有限网格开始（例如256×256），在“顶层”，将其划分为四个（“quad”源自拉丁语，我猜）128×128的“子网格”，然后将每个子网格再分成四个，如此反复，直到达到最小尺寸的块为止。现在我们已经了解了HashLife算法的第一个特性：它适用于 \(2^n \times 2^n\) 的网格。换句话说，网格的边长必须是2的幂次。下图展示了这一过程。

<image src="img/2_2.png" width="800px">

> 图1: 四叉树划分机制的概念

在原始的“四叉树压缩”中，每次遇到结构规范的块时就会停止划分，而如果不是结构规范的则继续划分。下图展示了这种压缩方法如何用于存储一个图案。正如你所看到的，原本的大块被存储为一组小块。

<image src="img/2_3.png" width="500px">

> 四叉树划分示例

在 HashLife 中，我们基本上采用类似的思想。我们不断进行划分，直到达到我们称之为“规范块”（canonical blocks）的结构。这些规范块构成了一组可以用来构建任何图案的基本块（对于数学爱好者来说，这类似于线性代数中的基）。

例如，我们可以将所有可能的 2×2 细胞块“规范化”。通过这种方式，我们将得到 16 种可能的 2×2 块，从完全空的/死亡的 2×2 块到完全充满生命的 2×2 块。利用这 16 种块，我们可以构建任何图案。因此，为了分解一个给定的复杂图案，我们执行四叉树划分，直到将其分解为许多 2×2 块。

现在，每个大于规范块的块由指向下一层次块的指针组成，最终指向规范块。下图展示了这一过程。你可以看到四叉树划分以及指向块的指针。请注意，我们现在不再存储块本身，而是存储指向更小块的指针。此外，我们可以通过缓存相同的块来优化空间使用。从现在开始，我们将称块为“节点”（nodes），因为无论它们处于哪个层次，它们都以相同的数据结构表示。

例如，一个 1024×1024 的块将由一个节点表示，该节点有 4 个指针，指向另外 4 个节点，而每个节点又分别有 4 个指针，依此类推。如果这个大块中包含许多重复的图案（比如空区域），那么你只需要存储其中一个空区域，而其他的所有空区域都可以简单地用指向它的指针来表示。

<image src="img/2_4.png" width="500px">

> 四叉树压缩

通过这一点，我们触及了 HashLife 算法的另一个非常重要的方面：节点的定义。正如我之前解释的，一个节点将表示某个层次上的一个块。因此，它将是一个具有某些属性的数据结构。接下来是它的定义:

```python
class Node:
    def __init__(self, sw, se, nw, ne):
        self.sw = sw
        self.se = se
        self.nw = nw
        self.ne = ne
        self.depth = 0
        self.area = 0
```

节点可以具有更多属性以处理一些技术细节（我将在后面解释）。目前（为了简单起见），我们只需要理解那段代码。首先，我们有四个属性叫做 `sw`, `se`, `nw`, `ne`，它们分别对应指向四象限中节点的指针，即西南节点、东南节点、西北节点和东北节点。`depth` 表示该节点在四叉树完整表示中的层次或深度。最后，`area` 虽然不是算法本身必需的，但它将在某些相邻处理中起到很大作用，我将在后面进行解释。

因此，在 HashLife 中，生命游戏（GoL）的网格现在由一个具有某些深度和指向更低一级节点的指针的单一节点表示。此外，如果一个节点位于第 1 层，那么它就是一个规范节点。在这种情况下，且仅在这种情况下，属性 `sw`、`se`、`nw`、`ne` 不是指针，而是数字：0 表示死亡细胞，1 表示存活细胞。另外，如果图案具有高度的规律性，即包含重复的子图案，那么数据结构的大小将会很小，因为每个重复的块都将由相同的指针表示。

在这个阶段，非常重要的一点是，在脑海中要有一个关于如何用子节点描述一个节点的顺序约定。在我的情况下，我从左下角（`sw` 节点）开始，从左到右进行，然后向上（再回到左边）。因此，我的顺序如下面的图所示。需要理解的是，这种顺序对实现完全没有影响，它只是为了方便你自己的思考。正如你将会看到的，在代码中会有一些部分，你需要频繁地拆分和重新组装节点。这个顺序有助于你在头脑中完成这项工作，并正确编写节点拆分的代码。

<image src="img/2_5.png" width="500px">

> 节点名称和顺序约定

## 压缩空间中进行规则演化

四叉树机制确实非常出色，它使我们能够以非常高效的方式存储巨大的图案。但这里有一个重要的问题需要解释：如果规则演化，我们仍然需要遍历每个单独的细胞，那么压缩的意义何在？如果我们每次应用规则时都需要解压数据结构，我们又能得到什么好处呢？答案是：**我们并不会解压！我们直接在压缩的数据结构上应用规则！**

到目前为止，我们还没有提到 HashLife 算法是如何演化网格的。它最令人印象深刻的一点就是我之前提到过的：**在不展开或解压四叉树的情况下演化压缩后的图案！** 基本思想其实很简单。四叉树的概念引导我们进行递归思考：你有一个大块区域，调用一个函数将其分割，并对四个部分递归地调用自身。这大概就是核心思想。让我们将执行生命游戏（GoL）步骤的函数称为“evolve”。这个函数接收一个方形网格，并在细胞上应用 GoL 的规则。现在我们可以考虑实现这个函数的递归版本。换句话说，该函数会在四个分割的子块上调用自身，直到达到最小尺寸为止。它的伪代码可能如下所示：

```python
def evolve(node):
    
    if node.depth==2:
        return evolve node using GoL rules
    else:
        res1 = evolve(node.sw)
        res2 = evolve(node.se)
        res3 = evolve(node.nw)
        res4 = evolve(node.ne)
        
        res = assembleCenterNode(re1, res2, res3, res4)
        
        return res
```

不幸的是，这段伪代码存在一个巨大的缺陷：为了演化一个节点，你需要它的邻居（至少每边额外的一行和一列）。虽然可以想到一些解决这个问题的方法，但大多数解决方案无法提供算法第二部分（即“时间压缩”）所需的结构。比尔·高斯珀理想化的一种方法如下：

我们引入“中心节点”的概念。基本上，每个节点现在都有一个中央区域，我们将在该区域内计算结果。现在，该算法接收一个节点，并返回一个向前演化一代的更小节点。下图展示了这种方案的几何结构。

<image src="img/2_6.png" width="500px">

> 中心节点表示法。每个节点都有一个中央区域，在该区域内我们确保计算出结果（下一代）。我们仍然执行四叉树细分，但在每一层中，节点也具有中心节点的概念。中心节点的尺寸是原始节点的一半（宽度和长度各减半），并且完全居中。

总之，函数 `evolve` 接收一个位于层级 `depth` 的节点，并返回一个位于层级 `depth-1` 的新节点，因为它的尺寸是原始节点的一半。一个重要的点是，尽管结果在物理上位于前一个节点的中心，但新节点并没有“位置”的概念，因为它的位置是由与子节点和父节点的链接定义的。它只是节点类的一个新实例，恰好表示前一个较大块的生命游戏（GoL）的下一代。对于一个节点而言，唯一有意义的位置是它是父节点的东北、西南等方向的部分。

另一个非常重要的要点是，每一步的结果都是一个更小的节点。因此，我们不能仅仅通过在前一个结果上调用函数来持续演化，因为这样会迅速使结果缩小到无。幸运的是，这个问题很容易解决。在每次迭代中，我们在顶层节点（称为根节点）上添加一个空的“边界”，从而创建一个新的根节点，原来的节点位于中间。现在，世代的循环过程如下：

1. 获取一个深度为 \(d\) 的节点。
2. 添加一个空边界，生成一个深度为 \(d+1\) 的新节点。
3. 获取一次迭代的结果，该结果是一个尺寸减半的节点（深度 \((d+1)-1 = d\)）。
4. 重复上述步骤。

这样就可以确保节点不会过快缩小，同时继续进行演化计算。

到目前为止，我们已经了解了中心节点以及接收一个节点并返回包含结果的更小节点的高层方法。现在的问题是，这个中心节点在空间上与四叉树的几何结构并不对齐。如果你回顾之前的图，可以推断出中心节点由原始大节点的子节点（东北、西北等）的部分组成。当我们调用 `evolve` 函数时，它必须计算这个中心区域的结果。正如我们之前提到的，我们不能简单地对每个子节点调用 `evolve`，因为这样每个子节点只会生成它们自己的中心节点。在之前的图中，蓝色节点是我们正在调用 `evolve` 的节点，绿色节点是它的子节点。请注意，如果我们只是对每个绿色节点调用 `evolve`，结果将仅仅是绿色中心区域，而我们没有足够的信息来组装蓝色中心节点。

为了解决这个问题，我们创建了 9 个辅助节点，如下图中以红色节点所示。这些节点包括原始的子节点以及另外 5 个以特定方式定位的节点，这样它们的结果可以被组合起来，形成原始节点的中心区域结果。

<image src="img/2_7.png" width="800px">

> 从 9 个辅助节点的结果中组合出中心节点的过程如下：我们希望演化的原始节点是图中的大黑节点，其子节点由蓝色节点表示，而辅助节点则用红色表示（每个辅助节点对应的子节点也一并展示）。每个红色节点的中心区域以绿色填充，用于展示其结果。为了便于理解，这些步骤被依次展示出来。当我们计算每个辅助节点的结果时，可以利用这些结果的一部分来组装最终结果，即黑节点的中心区域。

现在，我们可以将我们的 `evolve` 函数更新为以下伪代码：

```python
def evolve(node):
    
    if node.depth==2:
        return evolve node using GoL rules
    else:
        node1 = Create Auxiliary Node 1
        node2 = Create Auxiliary Node 2
        node3 = Create Auxiliary Node 3
        node4 = Create Auxiliary Node 4
        node5 = Create Auxiliary Node 5
        node6 = Create Auxiliary Node 6
        node7 = Create Auxiliary Node 7
        node8 = Create Auxiliary Node 8
        node9 = Create Auxiliary Node 9
 
        node1Res = evolve(node1)
        node2Res = evolve(node2)
        node3Res = evolve(node3)
        node4Res = evolve(node4)
        node5Res = evolve(node5)
        node6Res = evolve(node6)
        node7Res = evolve(node7)
        node8Res = evolve(node8)
        node9Res = evolve(node9)
 
        result = assembleCenterNode(node1Res, node2Res, node3Res, node4Res, node5Res, node6Res, node7Res, node8Res, node9Res)
        
        return result
```

现在我们已经得到了一个可行的算法。不幸的是，这还没完呢 😅。目前，这个算法可以在压缩的网格上执行生命游戏（GoL）的一个步骤，这已经非常出色了。现在，我们可以以压缩的方式演化一个非常大的图案，并且在不解压的情况下对其执行一步操作。这就是对原始生命游戏算法的一种“空间优化”。在我们进入“时间优化”之前，我们需要对代码做一个小改动。

尽管当前的伪代码可以工作，但我们将会添加额外的一组步骤，这将在后续的时间优化中起到关键作用。这一修改涉及我们如何使用 9 个辅助节点的结果来重新组装最终的中心节点。如果你回顾之前的图示，我们可以使用绿色节点来重新组合黑色中心节点，但这将涉及大量拆分节点的操作。例如，如果我们称黑色中心的最终节点为 `res`，那么生成的绿色节点的左下角并不会计算出完整的 `res.sw`，而实际上只会计算出 `res.sw.sw`。此外，如果我们称绿色生成节点为 `res1`，那么构成 `res.sw.sw` 的小绿色方块实际上将是 `res1.ne.sw`。依此类推……

为了避免对所有子子节点进行拆分，我们获取 9 个结果，并组装出 4 个中间节点，如下图所示。请注意，这一过程看似没有必要，实际上确实有些冗余，因为我们多次使用相同的辅助节点来组装这 4 个中间节点。然而，正如我之前提到的，这将在后续提升速度时成为一个关键点。

<image src="img/2_8.png" width="800px">

> 巧妙的中心节点组装策略. 这种组装中心节点的巧妙策略将使得超高速计算成为可能。

现在我们需要再次更新伪代码。这次我们需要一个辅助函数，名为 `getCenterNode`，它接收一个节点，将其拆分并重新组装中心部分，并将结果作为节点返回。

```python
def evolve(node):
    
    if node.depth==2:
        return evolve node using GoL rules
    else:
        node1 = Create Auxiliary Node 1
        node2 = Create Auxiliary Node 2
        node3 = Create Auxiliary Node 3
        node4 = Create Auxiliary Node 4
        node5 = Create Auxiliary Node 5
        node6 = Create Auxiliary Node 6
        node7 = Create Auxiliary Node 7
        node8 = Create Auxiliary Node 8
        node9 = Create Auxiliary Node 9
 
        node1Res = evolve(node1)
        node2Res = evolve(node2)
        node3Res = evolve(node3)
        node4Res = evolve(node4)
        node5Res = evolve(node5)
        node6Res = evolve(node6)
        node7Res = evolve(node7)
        node8Res = evolve(node8)
        node9Res = evolve(node9)
 
        intermediateNode1 = assembleNode(node1Res, node2Res, node4Res, node5Res)
        intermediateNode1 = assembleNode(node2Res, node3Res, node5Res, node6Res)
        intermediateNode1 = assembleNode(node4Res, node5Res, node7Res, node8Res)
        intermediateNode1 = assembleNode(node5Res, node6Res, node8Res, node9Res)
        
        result = assembleNode( getCenterNode(intermediateNode1), getCenterNode(intermediateNode2), 
                               getCenterNode(intermediateNode3), getCenterNode(intermediateNode4) )
        
        return result
```

## 时间

到目前为止，该算法还不是完整的 HashLife。它比朴素的“网格扫描”生命游戏（GoL）实现更快，仅仅是因为它在压缩数据上计算步骤。因此，对于非常大的（ mostly empty，即大部分为空的）网格，它的计算量更少。但它的演化仍然是普通的“一步”生命游戏演化。

现在，让我们来谈谈速度。我将“时间优化”分为两部分。第一部分是直观的动态规划方法，即对目前已开发的结构使用哈希函数。第二部分才是真正的魔法发生的地方！

### 哈希函数与动态规划

要理解这种时间优化，你需要了解动态规划的工作原理。它主要涉及“缓存结果”的概念。这一原则极其简单而强大。简而言之，如果你有一个计算过程（可能是一个函数），它接收一组参数并返回一个结果，你可以将这个结果缓存起来，这样当下次接收到相同的参数时，你就无需再次浪费时间进行计算，而是直接返回缓存中的结果。这种方法有时被称为“记忆化”（memoization）。这种缓存通常可以通过一种常见的数据结构——哈希表（Hash table）轻松实现。我想现在大家应该明白“HashLife”这个名字的由来了吧 😅。这一过程正是第一次时间优化的核心所在。我们将要“记忆化”的函数正是 `evolve` 函数。

这种记忆化虽然简单，但也需要我们注意一些技术细节。第一步是创建一个哈希表作为我们的缓存。最初，这个缓存将是空的。哈希表中的键将是节点，值也将是节点（但它们是较小的中心结果）。这就是最简单的缓存机制。基本上，哈希表的行为将与 `evolve` 函数完全一致。因此，在 `evolve` 函数中，我们首先要检查我们要处理的节点是否已经存在于哈希表中。如果存在，则无需进行任何计算，直接返回哈希表中对应键的结果即可。如果不存在，则按照我们之前展示的方式正常进行计算。然而，在返回结果之前，请确保在哈希表中添加一个新的条目，其中键是我们处理的节点，值是计算出的结果。这样一来，下次函数接收到这个节点时，将不再需要任何计算时间。

与所有哈希表一样，这个哈希表也需要一个哈希函数。哈希函数是一个接收哈希键并计算出内部哈希列表中存储值的地址的函数。为了使这一过程成为可能，我们的节点类必须是“可哈希的”（Hashable）。这意味着如果两个节点表示相同的生命游戏（GoL）图案，那么在调用哈希函数时它们应该返回相同的值。虽然实现这一点相对容易，但分析起来并不那么简单。

由于空间压缩机制，我们的节点已经部分具备了可哈希的特性。理论上，我们可以直接使用节点的地址作为哈希函数的结果。这是因为四叉树结构的空间压缩过程确保了相等的节点具有相等的指针。因此，如果两个节点或子节点在生命游戏网格中表示相同的图案，通过空间压缩架构，它们实际上是同一个节点（具有相同的指针）。然而，这里存在一个小复杂点……

正如我们之前所见，在计算结果的过程中，我们需要组装一些与四叉树节点不对齐的新节点（例如，中心节点）。不过，我们可以通过让哈希函数返回原始节点子节点指针的某种组合来解决这个问题。这将使得两个具有不同指针但子节点表示相同的节点返回相同的哈希函数值，从而被视为同一个节点。这种使节点可哈希的技术策略，允许两个节点无论其在网格中的位置如何，都能返回相同的结果。

值得分析一下我们在 `evolve` 函数中通过记忆化（memoization）能获得多少速度提升。让我们考虑一个极端情况。想象一个 1024×1024 的节点，它不会扩展，并且是周期性的（假设在 n 代之后会回到初始图案）。最初，缓存是空的，但随着网格的演化，越来越多的部分会被缓存起来，直到最终，我们甚至为根节点缓存了所有 n 个结果。当我们达到这一点时，就不再需要任何计算！整个生命游戏（GoL）的推演将简化为在缓存中的 n 次“跳跃”。因此，不再需要进行任何处理。此时的限制仅在于哈希表值之间的内存访问速度。

下一个小程序展示了使用这种“慢速”HashLife 算法演化两代的过程。在下一节中，你将明白为什么这仍然被认为是慢的 😅。网格包含一个简单的图案（一个非常著名的振荡器）。网格中还有不同粗细的线条，帮助我们了解四叉树的划分（但这只是为了视觉辅助）。你可以按下播放按钮，或者使用滑块前后导航。在算法的演化过程中，完成一代可能需要多个（许多）步骤。在此期间，你会看到一个蓝色的“节点”四处跳动，这表示当前正在处理的四叉树节点。请注意，它还会跳到与四叉树不对齐的地方，这是因为在每一层中它正在测试 9 个辅助节点。每当它遇到一个“未见过”的节点（从未被处理过的节点），它会计算结果并将其存储在哈希表中（缓存）。哈希表由小程序右侧的节点堆栈表示。因此，每当蓝色方块访问一个未见过的节点时，它会被缓存，并在右侧的表格中出现一个小副本。在这个表格中，节点以绿色和红色单元格显示，分别代表原始节点及其结果。请注意，我们还会缓存空节点。另一方面，每当蓝色节点访问一个已经访问过的节点时，对应的哈希元素会闪烁蓝色，表示我们不需要重新处理它，而是直接从哈希表中获取结果。

> 小程序略, 详见: [hashlife](https://www.dev-mind.blog/hashlife/)

另一个非常有趣的现象是，一旦哈希表填充完整，它的节点会持续闪烁，并且值之间的跳转会继续发生。为了便于可视化，我在每一代之后清除了哈希表，否则屏幕会不够用。毋庸置疑，在实际运行中情况并非如此。哈希表只会不断增长，并最终达到一个增长极其缓慢、甚至对于周期性图案完全停止增长的阶段。

我们可以将这个例子中使用“慢速”HashLife算法的处理成本与朴素方法进行比较。这个网格的深度为 5，这意味着它有 32×32（1024）个单元格。因此，朴素方法每代需要进行 1024 个“计算单元”的循环。而对于 HashLife，我们使用的是第 1 层（2×2）的标准结果，这意味着我们下降到的最小节点位于第 2 层（4×4）。为了计算一代，我们需要深入 5 - 2 = 3 层。然而，对于每一层，我们需要测试 9 个辅助节点，这给我们带来了 729 个“计算单元”。嗯……这并不令人印象深刻，对吧？确实不令人印象深刻，实际上恰恰相反！一旦我们进入第 6 层及更高层，HashLife 看起来每代需要更多的“计算单元”。但是！（肯定会有“但是”对吧？😂😂）这只是针对第一代而言，并且我们还没有计入所有被缓存的重复“大”节点。如果图案是重复的或者包含大片空区域，这些区域很快会被缓存下来，之后就不再需要处理！事实上，当你运行 HashLife 时可以注意到这一点。最初，速度较慢，哈希表正在逐步建立。然后，它开始加速，直到根节点在每一代都被缓存下来，而对于周期性图案，我们只需从一个根节点跳到下一个根节点，一代接一代。这将原本需要 1024 个计算单元的循环简化为一个“跳跃”，而这个跳跃只需要一个计算单元（哈希表查找）。

### 超高速!!!

如果你和我第一次看到时一样，对“在哈希表中跳跃节点”的概念感到兴奋，那么接下来的内容会让你更加惊喜。哈希优化带来的加速并不是使 HashLife 所闻名的原因。

回想一下，最初我们对 9 个深度为 1 的节点调用 `evolve`，以收集足够的信息来组装中心节点。接着，我们从这 9 个节点中组装出 4 个深度为 1 的子节点，这些子节点的中心将构成最终的深度为 1 的节点。一开始，这似乎没有必要。既然可以直接从之前的 9 个结果中组装中心，为什么还要先组装 4 个深度为 1 的节点再取它们的中心呢？

这就是魔法发生的地方！它与我们如何从这 4 个节点中提取中心节点以组装结果有关。我们没有使用一个函数来提取它们的中心，而是再次使用 `evolve` 函数！！！仔细想想，`evolve` 函数确实返回了中心节点，但它是向前推进了一代的中心节点。就是这样。现在，我们终于得到了真正的 HashLife 算法的伪代码。

```python
def evolve(node):
    
    if node.depth==2:
        return evolve node using GoL rules
    else:
        node1 = Create Auxiliary Node 1
        node2 = Create Auxiliary Node 2
        node3 = Create Auxiliary Node 3
        node4 = Create Auxiliary Node 4
        node5 = Create Auxiliary Node 5
        node6 = Create Auxiliary Node 6
        node7 = Create Auxiliary Node 7
        node8 = Create Auxiliary Node 8
        node9 = Create Auxiliary Node 9
 
        node1Res = evolve(node1)
        node2Res = evolve(node2)
        node3Res = evolve(node3)
        node4Res = evolve(node4)
        node5Res = evolve(node5)
        node6Res = evolve(node6)
        node7Res = evolve(node7)
        node8Res = evolve(node8)
        node9Res = evolve(node9)
 
        intermediateNode1 = assembleNode(node1Res, node2Res, node4Res, node5Res)
        intermediateNode1 = assembleNode(node2Res, node3Res, node5Res, node6Res)
        intermediateNode1 = assembleNode(node4Res, node5Res, node7Res, node8Res)
        intermediateNode1 = assembleNode(node5Res, node6Res, node8Res, node9Res)
        
        result = assembleNode( evolve(intermediateNode1), evolve(intermediateNode2), 
                               evolve(intermediateNode3), evolve(intermediateNode4) )
        
        return result
```

当我第一次意识到这个修改时，我对它的效果并不抱太大希望。事实上，乍一看，这似乎会让程序变慢，因为我们增加了递归的层级。现在每次调用 `evolve` 都会递归调用自身两次。这意味着我们有可能开发出一个复杂度为 O(2^N) 的算法，实际上也确实如此。虽然每次调用都会减少问题规模，从而在一定程度上摊销了复杂度，但看起来这在速度上仍是一场悲剧。

说实话，当我第一次实现这个算法的最终版本时，并没有过多理性地去分析它。我当时试图让 `evolve` 递归调用两次，因为我明白这是跳过代数的唯一方法。于是，我直接运行了代码，令我惊讶的是，它居然成功了！！！就那样，我完成了自己的 HashLife 实现！我无法用语言表达当时的喜悦之情。但我也必须解释清楚为什么它能够奏效！

关键在于，尽管该算法具备成为 O(2^N) 的所有机制，但我们通过哈希极大地优化了它！这就是它如此快速的原因！现在，哈希变得非常重要，因为当我们调用 `evolve` 时，我们会跳过多代（记住，我们现在在它的内部调用了两次 `evolve`）。

但是每次我们跳过多代呢？

事实证明，第二次对 `evolve` 的调用使得最终结果在时间上向前推进了 \(2^{\text{depth}-2}\) 代！例如：如果我们在一个 8×8（深度为 3）的节点上调用 `evolve`，我们会生成 9 个 4×4 的节点，并调用 `setpNode`，从而得到 9 个向前推进一代的节点。然后，从这些已经推进一代的节点中，我们组装出 4 个 4×4 的节点（它们也会是推进一代的状态），再次调用 `stepNode`，这样又推进了一代，最终得到的 4 个结果将被用来组装最终结果，这个结果会比初始状态前进两代。

如果是一个 16×16 的节点，那么我们会得到 9 个 8×8 的子节点，它们会推进两代（因为它们和前面的情况一样是 8×8）。从这 9 个节点中，我们再组装出 4 个 8×8 的子节点，它们已经处于未来两代的状态，再次调用 `evolve` 后，它们会再推进两代（现在总共推进四代）。

如果是 32×32 的节点，则会有 9 个 16×16 的子节点，它们会推进四代（因为它们和前面的情况一样是 16×16）。从这 9 个节点中，我们再组装出 4 个 16×16 的子节点，它们已经处于未来四代的状态，再次调用 `evolve` 后，它们会再推进四代（现在总共推进八代），依此类推……

因此，每增加一层深度，我们推进的代数就会 **翻倍**！

就是这样，这就是 HashLife！如果我们有一个 32×32 单元格（深度为 5）的根节点，每次调用 `evolve` 都会一次性推进 8 代。得益于哈希机制，所有冗余的计算都被缓存起来，因此我们实际上并不需要每次都计算这 8 步。因此，随着算法的演化，它的速度会越来越快。实际上，关于这个算法有一个有趣的事实：在一次调用 `evolve` 的过程中，某个时刻我们可能会有处于不同“年龄”的节点。例如，有些节点可能对应第 3 代，而另一些节点则处于第 5 代，等等。然而，最终它们都会被“拼接”在一起，共同演化以形成正确的 \(2^{\text{depth}-2}\) 结果。这是因为当我们缓存一个深度为 5 的节点的结果时，我们实际上缓存的是该节点向前推进 8 代后的结果！因此，哈希机制不仅加速了结果的计算，还让我们能够跳跃到未来的多代。回到我们的例子，如果有一个 32×32 的周期性图案网格，在某个时刻我们会缓存其根节点的结果，从那时起，每次到达该节点时，我们都可以利用缓存完成一次计算。更重要的是，这一次计算就相当于向前推进了 8 代！

### 超越光速...

正如我提到的，HashLife 的惊人之处在于，每一步都会使网格向前推进 \(2^{\text{depth}-2}\) 代。因此，一个 32×32 的网格会向前推进 8 代……而 64×64 的网格每次则会推进 16 代。所以，网格越大，它前进的代数越多！但是等等……如果我们想让某个不是很大的图案（比如 16×16）更快地前进呢？我们能不能简单地添加一个零边界（使图案深度加 1），让它变大从而更快地前进？那么，加上两个零边界又会怎样呢？

是的!

不仅如此。如果你在每次迭代中都添加一个新的零边界呢？😱 想象一下：第一步你演化了 8 代，然后下一次迭代演化进程变为 16 代，再下一次是 32 代，继续运行的话就是 64 代、128 代……很快，你将在算法的单一步骤中演化**数百万代**（抱歉用了大写字母，但我实在忍不住这样表达 😅）。

这听起来很荒谬，但确实完全可能！因为你添加的是零值区域，它们几乎可以瞬间被缓存，而且得益于空间压缩技术，每一步你只需增加几百字节的数据！它的速度快得令人“难以置信”，有时甚至会成为一种“缺点”……（详见下一节）。

## 技术细节

Hashlife 算法在你第一次接触时并不容易理解。如果你独自研究又没有详尽的参考资料，可能会觉得有些困难（至少对我来说是这样）。然而，伪代码最终非常简洁明了，其实现也相当简单易编码。尽管如此，这里有一些技术细节是我真的想要探讨的。

第一个问题是关于过于随机的图案，或者那些会增长或移动的图案。这并不是 Hashlife 独有的技术问题，但它确实存在。过于随机的图案往往会迅速增大缓存。再加上像宇宙飞船和喷气机（查看“生命术语表”以了解这些名称）这样“四处移动”的图案，Hashlife 在演化时可能会花费一些时间（但仍能享受超高速的奇妙之处）。在实际操作中，对于不断增长的图案，我们需要持续扩大网格。但这样一来，之前提到的那种“令人难以置信的速度”就会成为一种“副作用”。因此，你可能会错过一艘宇宙飞船的演化过程，因为它会不断地在空间中越飞越远，导致网格变得越来越大。

另一个重要的方面是，Hashlife 对于处理大规模图案非常有效。空间压缩技术使得处理 32768×32768 这样大小的网格变得轻而易举。但这里有一个非常重要的问题：如何显示一个 32768×32768 的网格图像？它实际上包含 10 亿像素！当然，这与 Hashlife 算法本身无关，每个人应该根据自己的需求来解决这个问题。我选择的解决方案是跟踪每个节点的“活跃区域”或活细胞的数量。这并不难实现，因为在我们缓存一个节点时，我们可以同时缓存它的所有属性。此外，创建或修改节点的函数会与其他节点交互，而这些节点已经预先计算好了各自的面积。因此，我们可以在 O(1) 的时间内跟踪每个节点（直到根节点）的总面积。

我们可以利用面积信息在较少像素的窗口中绘制一个巨大的节点。策略是将低于特定深度的节点视为像素本身。像素的亮度将由该节点的面积决定。下图展示了三种不同“像素尺寸”的级别以及两种亮度策略。

<image src="img/2_9.png" width="500px">

<image src="img/2_10.png" width="500px">

> 针对32768×32768网格的不同分辨率。在上方，策略是根据节点中是否存在存活的细胞来将像素设置为黑色或白色。也就是说，如果代表像素的节点中至少有一个存活的细胞，那么整个节点在屏幕上就会显示为一个黑色像素。下方的策略是根据节点的面积倒数来决定像素的亮度。因此，如果节点中有大量存活的细胞，屏幕上的像素将会更暗。 从左到右，不同的深度阈值产生了最终网格图像的不同分辨率。

还有一些其他较小的技术问题，但它们只是细节上的。除此之外，我们可以根据节点的大小来保持代数计数（相应增加），跳过空节点（甚至不对其进行缓存），等等。

## 一些成果

在结束这篇文章之前（真是见鬼了，我根本停不下来写这个算法😅），我想展示一些结果，并对生命游戏（GoL）中最具趣味的图案稍作评论——而这一图案之所以成为可能，完全得益于 HashLife 算法。

### 元细胞

由于 HashLife 让我们能够在大网格中使用大规模图案，人们开始创造出各种疯狂的图案。有些图案会发射滑翔机（gliders），有些图案可以与其他图案“互动”以形成新的图案，等等。甚至有一种方法可以通过特定的小图案对撞击做出反应来“编程”一个图案。根据该图案的“状态”，它可以执行操作 X 或 Y（例如，产生另一个滑翔机或自我消亡）。

2006年，一位名叫 Brice Due 的人创造了一个周期性的 2048×2048 图案，名为 OTCA Metacell。它是一个初始为空的大正方形，看起来像下图所示：

<image src="img/2_11.png" width="500px">

> OTCA Metacell. Source: [LifeWiki](https://conwaylife.com/wiki/OTCA_metapixel)

这是一种可编程的图案。这里所说的“可编程”并不是指我们用不同于生命游戏（GoL）三条简单规则的方式来演化它——网格仍然按照这三条简单规则进行演化！我的意思是，它有一个精心设计的小图案区域，通过让这些图案以特定方式演化，可以在那里“编程”整个网格的行为。当你开始演化这个 Metacell 时，一条滑翔机流会从图案左侧向这个“程序区域”方向移动。在那里，它们会撞击到一些特殊图案，根据这些图案的类型，可能会“触发”一系列连锁反应，从而激活整个图案顶部和右侧的一组滑翔机生成器。当这些滑翔机生成器被激活后，它们开始产生滑翔机，这些滑翔机会“填充”Metacell 的整个空旷区域。因此，可以说这个 Metacell 有两种“状态”。当滑翔机生成器被激活时，整个图案会被滑翔机填满，此时它是“开启”状态；而当它们未被激活时，中心区域为空，此时 Metacell 被认为是“关闭”状态。以下动画展示了 Metacell 正在切换到“开启”状态的确切时刻。

> 视频略, 详见[hashlife](https://www.dev-mind.blog/hashlife/)

这个 Metacell 的第二大有趣之处在于，它的“程序区域”能够与输入和输出进行通信。有 8 个“输入”可以感知外部的滑翔机并与外部世界同步。此外，它们被精心设计，使得我们可以将两个或多个 Metacell 并排放置，从而构建一个“超级网格”或“超级星系”（正如他们所称）。现在，我们可以根据相邻 Metacell 的状态来编程让 Metacell 自行开启或关闭。实际上，我们可以让一个由 Metacell 组成的网格像生命游戏（GoL）的三条规则那样运行！这就是生命游戏中的生命游戏！！！！事实上，关于 Metapixel 的维基百科页面提到了一位名叫 Adam P. Goucher 的人，他创造了一个闪烁的 MetaMetaCell（是的，名字中有两个“Meta”）。这意味着我们有一个 Metacell，其中每个细胞本身又是一个 Metacell！想到这一点时，我忍不住想起了《黑客帝国》电影……😅

如果没有 HashLife 算法，构建或测试这样的图案将会非常困难。举个例子，在下一节中，我将尝试给出关于一个 Metacell 的一些定量结果。为了让大家有个直观的认识，单个 Metacell 的周期为 35328 代。这意味着，在传统的生命游戏（GoL）算法中，我们必须对一个 2048×2048 的网格演化 35328 次，才能看到 Metacell 的一步变化。现在想象一下一个由 16×16 或甚至 64×64 个 Metacell 组成的网格……

### 定量结果

在这一节中，我将尝试展示一些以数字形式呈现的结果。我将使用一个由 15×15 的 Metacell 网格组成的“超级星系”（Metagalaxy），这构成了一个 32768×32768 的网格。在内存中，该网格的未压缩版本将占用 1073741824 字节（约 1GB）。而包含所有开销（如节点面积、深度、指向子节点的指针等）的压缩节点数组仅占用 1603559 字节（小于 2MB）。演化的初始阶段较慢，但随着演化进行会变得更快。下图展示了从第一代开始计算每一代所需时间的图表，同时也显示了缓存大小（以字节为单位）的变化。正如你所见，随着代数增加，缓存逐渐填满，并在某个时刻停止增长（因为这个图案是周期性的）。

<image src="img/2_12.png" width="800px">

<image src="img/2_13.png" width="800px">

> 关于“超级星系”示例的时间和内存消耗图表。第一代需要大约 50 秒来计算，因为此时缓存正在被填充（Golly 的 Java 版本只需几秒，这里的 50 秒是我的 Python 实现所需的时间）。但一旦有足够的冗余，后续的步骤所需时间会越来越少，最终几乎达到即时完成的程度（即使是在 Python 中）。

值得一提的是，这里的“代”实际上指的是“步”，因为请记住，每一步（最终只需几毫秒）实际上一次性计算了 \(2^{15}\) 代（因为我们会在根节点上额外增加两层深度）！

如果我们开启“超越光速模式”，并在第一代之后让图案继续演化 1 分钟（总计约 2 分钟），我们可以将图案演化到第 **1,152,921,504,606,781,440** 代！！！那是 **1 百亿亿代**（我不得不查了下正确的命名，嘿嘿嘿）。

最后，我将为你留下“超级星系”演化的动画。

<image src="img/2_14.gif" width="500px">

> 超级星系（Metagalaxy）。它模仿了我们在 16×16 网格中用作示例的振荡器。不同之处在于，这里的每个细胞实际上是一个 2048×2048 大小的元胞（Metacell）！

## 结论

HashLife 算法真是太惊人了！对此没有其他结论。它是一个解决惊人问题的惊人算法。就是这样。现在，我感到有必要去学习一些关于形式语言、自动机等相关知识。我希望你在阅读关于 HashLife 的文章时，能像我在撰写它时一样享受（尽管英语表达可能有些拙劣 %-） 。和往常一样，代码已经在 [GitHub](https://github.com/ngmsoftware/hashlife) 上，如果你想查看的话。

## 参考文献

* [Tomas G. Rokicki, blog post](https://www.drdobbs.com/jvm/an-algorithm-for-compressing-space-and-t/184406478)
* [Bill Gosper, original paper](https://www.sciencedirect.com/science/article/abs/pii/0167278984902513?via%3Dihub)
* [jennyhasahat.github.io](https://jennyhasahat.github.io/hashlife.html)
* [Golly’s home page](http://sf.net/projects/golly/)
* [Life Lexicon](https://bitstorm.org/gameoflife/lexicon/)
* [Metapixel home page](https://www.conwaylife.com/wiki/OTCA_metapixel)
* [Wikipedia entry](https://www.conwaylife.com/wiki/HashLife)

