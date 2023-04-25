---
title: "Diff Adjacent (AtCoder Beginner Contest 297 Ex)"
date: 2023-04-26T19:00:00+09:00
draft: false
math: true
description: "Diff Adjacent (AtCoder Beginner Contest 297 Ex)の解法を説明します。
同じ解法の解説はすでにありますが、この記事では立式パートを詳しめに書いています。"
---

[Diff Adjacent (AtCoder Beginner Contest 297 Ex)](https://atcoder.jp/contests/abc297/tasks/abc297_h)の解法を説明します。
説明する解法は求めたい長さの総和が畳み込みの形で表せることを用いるもので、すでに解説がありますが(→ [同じ解法の解説](#同じ解法の解説))、
この記事では立式パートを詳しめに書いています。

### 解法
要素の和が$n$の素晴らしい整数列の長さの合計を$s_n$とします。加えて、$s_n$を計算するためにそのような列の個数$c_n$も考えます。

#### $c_n\ (n = 0, 1, \dots, N)$を計算する
まず、$c_n$の漸化式を導きます。そのためにすべての$i = 1, 2, \dots, n$について、要素の和が$n$、先頭の要素が$i$である素晴らしい整数列を数えて、それらを足し合わせることにします。
例として、$n = 7, i = 2$のケースを考えてみると、

1. 要素の和が$5$の素晴らしい列の先頭に$2$を付け加えることで条件を満たす列がすべて作れます。
しかし、作られる列の中には先頭2要素が同じ値になっていて条件を満たさない列も含まれてしまっているので、その分を引く必要があります。
2. 引く値は要素の和が$5$、先頭の要素が$2$である素晴らしい列の個数です。
そのような列は要素の和が$3$の素晴らしい列の先頭に$2$を付け加えることで網羅できますが、また条件を満たさない列を含んでしまっているので、その分を引かなければいけません。
3. 次に引く値は要素の和が$3$、先頭の要素が$2$の素晴らしい列の個数です。
そのような列は要素の和が$1$の素晴らしい列の先頭に$2$を付け加えると得られます。
ここで和が$1$の正整数列の要素は$1$以下なので、(1), (2)とは違って得られる列はすべて条件を満たしています。
4. (1), (2), (3)より要素の和が$7$、先頭の要素が$2$の素晴らしい列の個数は$c_5 - (c_3 - c_1)$であることが分かります。

同様に考えると、

- $n = 7, i = 3$のケースでは$c_4 - c_1$
- $n = 7, i = 1$のケースでは$c_6 - (c_5 - (c_4 - (c_3 - (c_2 - (c_1 - c_0)))))$

このように要素の和が$n$、先頭の要素が$i$である素晴らしい列の個数は$c_{n - i}, c_{n - 2i}, \dots$にプラスマイナスを交互に付けて和を取ったものになります。一般には次のように表されます。
$$ \sum_{j = 1}^{\lfloor n / i \rfloor} (-1)^{j + 1} c_{n - ij} $$

この式から$c_n$の漸化式
$$ c_n = \sum_{i = 1}^{n} \sum_{j = 1}^{\lfloor n / i \rfloor} (-1)^{j + 1} c_{n - ij} $$
が得られます。

しかし、このままだと効率的に計算できません。
そこで、畳み込みの形に持っていきます。$ij = p$とおくと、
$$
c_n
= \sum_{p = 1}^{n} \sum_{j \mid p} (-1)^{j + 1} c_{n - p}
= \sum_{p = 1}^{n} \left( \sum_{j \mid p} (-1)^{j + 1} \right) c_{n - p}
$$
と書けます。ただし、$\sum_{j \mid p}$は$p$のすべての正の約数に渡る和です。

括弧内を$f_p$とおくと、
$$ c_n = \sum_{p = 1}^{n} f_p c_{n - p} $$
になり、さらに$f_0 = 0$とすると、
$$ c_n = \sum_{p = 0}^{n} f_p c_{n - p} $$
となります。こうして$c_n$を畳み込みの形で表せました。

立式ができたので後は計算するだけです。
$ f_p\ (p = 1, \dots, N) $の値は愚直に計算できます。
なぜなら、5桁の整数が持つ約数の個数は最大でも100個程度([OEIS A066150](https://oeis.org/A066150))だからです(調和級数を対数で上から抑えても分かります)。

$ c_n\ (n = 0, \dots, N) $の値は形式的冪級数を使って計算します。
$ C(x) = \sum_{n = 0}^{\infty} c_n x^n, F(x) = \sum_{n = 0}^{\infty} f_n x^n $とすると、上で得られた式と$ c_0 = 1 $から
$$ C(x) = F(x)C(x) + 1 $$
です。これを$C(x)$について解くと、
$$ C(x) = \frac{1}{1 - F(x)} $$
が得られます。
右辺の$N$次までの係数は形式的冪級数の逆元の計算によって$ O(N \log N) $でできます。

#### $s_n\ (n = 0, \dots, N)$を計算する

続いて$ s_n $の漸化式を導きます。$ c_n $のときと同じく先頭の要素$ i $で分けて考えます。

例えば、$ n = 7, i = 2 $のケースでは
$$ (1c_5 + s_5) - ((2c_3 + s_3) - (3c_1 + s_1)) $$
となります。$ c_5, c_3, c_1 $に係数が付いているのは先頭の$ 2 $の個数を数えているためです。

一般には
$$ \sum_{j = 1}^{\lfloor n / i \rfloor} (-1)^{j + 1} (j c_{n - ij} + s_{n - ij}) $$
です。

このことから$ s_n $を畳み込みの形で表すと、
$$ s_n = \sum_{p = 0}^n g_p c_{n - p} + \sum_{p = 0}^n f_p c_{n - p} $$
になることが分かります。ただし、$g_p$は
$$
g_p = \begin{cases}
\sum_{j \mid p} (-1)^{j + 1} j & (p \ge 1) \\\\
0 & (p = 0)
\end{cases}
$$
とします。

したがって、$S(x) = \sum_{n = 0}^\infty s_n x^n, G(x) = \sum_{n = 0}^\infty g_n x^n$とすると、
$$
\begin{align*}
S(x) &= G(x)C(x) + F(x)S(x) \\\\
\therefore S(x) &= \frac{G(x)C(x)}{1 - F(x)} \\\\
&= G(x)C(x)^2
\end{align*}
$$

後は$ c_n $と同じです。

### ソースコード
ライブラリ部分は省略しています。すべてのコードを見たい方は[提出ページ](https://atcoder.jp/contests/abc297/submissions/40758513)をご覧ください。

```cpp
int main(){
    std::cin.tie(nullptr);
    std::ios::sync_with_stdio(false);

    int N;
    std::cin >> N;

    std::vector<int> largestPrimeFactor;
    std::tie(std::ignore, largestPrimeFactor) = sieve(N);

    constexpr auto MOD = Poly998244353::MODULUS;

    Poly998244353 f(N + 1), g(N + 1);
    for(int i = 1; i <= N; i += 1){
        for(int d : getDivisors(i, largestPrimeFactor)){
            ll sign = (d + 1) % 2 == 0 ? 1 : MOD - 1;
            f[i] += sign;
            g[i] += sign * d;
        }

        f[i] %= MOD;
        g[i] %= MOD;
    }

    auto c = (Poly998244353::one() - f).inv();
    auto s = g * c * c;

    std::cout << s[N] << std::endl;
}
```

OCamlのソースコードもあります。全体のコードは[提出ページ](https://atcoder.jp/contests/abc297/submissions/40721345)をご覧ください。
```ocaml
let () =
  let n = Scanf.scanf " %d" Fun.id in
  let _, prime_factor = sieve n in
  let a = Array.make (n + 1) 0 in
  let b = Array.make (n + 1) 0 in
  let () =
    Iter.(1 -- n) |> Iter.iter @@ fun i ->
      Iter.of_array (divisors ~prime_factor i) |> Iter.iter @@ fun d ->
        let sign = if (d + 1) mod 2 = 0 then 1 else Mod998244353.(~-% 1) in
        a.(i) <- Mod998244353.(a.(i) +% sign);
        b.(i) <- Mod998244353.(b.(i) +% sign *% d) in
  let a = Poly998244353.of_array a in
  let b = Poly998244353.of_array b in
  let c = Poly998244353.(inv ~degree:n (one -: a)) in
  let s = Poly998244353.(b *: c *: c) in
  let s = Poly998244353.to_array s in
  Printf.printf "%d\n" s.(n)
```

### 同じ解法の解説
2023年4月26日に確認しました。

- https://atcoder.jp/contests/abc297/editorial/6188
- https://kmjp.hatenablog.jp/entry/2023/04/19/1030