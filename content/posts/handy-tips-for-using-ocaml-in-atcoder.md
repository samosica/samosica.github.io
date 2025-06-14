---
title: "AtCoderでOCamlを使うときのTips"
date: 2024-05-19T18:00:00+09:00
lastmod: 2024-09-02T02:00:00+09:00
draft: false
math: false
---

OCaml で AtCoder のコンテストに出始めて約1年が経ちました。
知見が溜まってきたのでまとめておきます。

<!--more-->

## 注意

本記事の想定環境は2023年8月の言語アップデート後の AtCoder の環境です ([参考](https://img.atcoder.jp/file/language-update/language-list.html)。2024年5月18日に確認)。
例えば、OCaml のバージョンは 5.0.0 を想定しています。

## Scanf.scanf では %d や %s の前に半角スペースを付ける

<!-- markdownlint-capture -->
<!-- markdownlint-disable MD038 -->

C言語の`scanf`は`%d`や`%s`だけでも値を読み込む前に空白文字 (スペース、タブ、改行)を読み飛ばしますが[^1]、
OCaml の`scanf`はそれだけだと読み飛ばしません。読み飛ばすことを明示する必要があります。

[^1]: これが仕様としてどこかに明記されているかは不明です。

`%d`や`%s`の前に` ` (半角スペース)を付けるとすべての種類の空白文字を読み飛ばします。また、`\n`を付けると改行だけを読み飛ばせます。
ただ、自分の経験では、AtCoder で値の区切り文字がどの空白文字なのかを気にしたことはないので、` `だけで十分だと思います。

加えて、とりあえず何にでも` `を付けておくといいと思います。
そうすることで、次のようなミスを防げます。

```ocaml
(* ケース1: "1 2"のように1行に2つの値が書かれていて、それを1つずつ読む *)
(* x を読んだ後、スペースを読み飛ばさないのでエラーになる *)
let () =
  let x = Scanf.scanf "%d" Fun.id in
  let y = Scanf.scanf "%d" Fun.id in
  Printf.printf "%d, %d\n" x y

(* ケース2: 1行に1つ値が書かれていて、それを1つずつ読む *)
(* 1行目を読んだ後、改行を読み飛ばさないのでエラーになる *)
let () =
  for i = 1 to 5 do
    let x = Scanf.scanf "%d" Fun.id in
    Printf.printf "%d\n" x
  done
```

ただし、例外もあります。例えば、空文字列を読む必要があるときに` %s`を使ってしまうと意図しない文字列が読み込まれてしまいます。

<!-- markdownlint-restore -->

## Printf.printf で flush する

`%!`でできます。インタラクティブな問題で必要になります。

## 64ビット符号付き整数が必要な問題が存在する

OCaml の`int`は最大でも**63ビット**符号付き整数の型なので、答えが64ビット符号付き整数にギリギリ収まる問題では`int`を使うと WA になります。

- [AtCoder Beginner Contest 321 D - Set Menu](https://atcoder.jp/contests/abc321/tasks/abc321_d)
- [AtCoder Beginner Contest 340 C - Divide and Divide](https://atcoder.jp/contests/abc340/tasks/abc340_c)

このような問題では代わりに`int64`を使います。
`int64`の基本的な演算は[OCaml library : Int64](https://ocaml.org/manual/5.0/api/Int64.html)に書かれています。
また、`int64`の値を`Scanf.scanf`で読み込むときは`%Ld`を指定します。

## Set と Map の cardinal は Θ(1) ではない

`Set.Make`、`Map.Make`によって生成されるモジュールにある`cardinal`関数は Θ(要素数) です。このことは実装を見ると分かります (ドキュメントには明記されていません)。

- <https://github.com/ocaml/ocaml/blob/e86f9e5d41217e8c824455206e854072b803b170/stdlib/set.ml#L415-L417>
- <https://github.com/ocaml/ocaml/blob/e86f9e5d41217e8c824455206e854072b803b170/stdlib/map.ml#L485-L487>

そのため、要素数が何回も必要になる問題で使うと TLE になります。

- [AtCoder Beginner Contest 343 D - Diversity of Scores](https://atcoder.jp/contests/abc343/tasks/abc343_d)

もし、要素数を Θ(1) で取得したいときは core の`Core.Map`モジュールを使うと良さそうです (自分はまだ使ったことがありません)。`Core.Map.length`が`cardinal`に相当します。

>length map returns the number of elements in map. O(1), but Tree.length is O(n).
(引用元: [core v0.16.1 · OCaml Package](https://ocaml.org/p/core/v0.16.1/doc/Core/Map/index.html#val-length))

また、もし、要素間の大小関係に基づく操作が必要ないときは標準ライブラリの`Hashtbl`モジュールも使えます。`Hashtbl.length`が`cardinal`の代わりになります。

<!-- markdownlint-disable-next-line MD013 -->
補足: `cardinal`関数を Θ(1) にしたいという要望はすでに GitHub の issue にあります。気になる方は[Make Map length run in O(1) instead of O(n) · Issue #12866 · ocaml/ocaml](https://github.com/ocaml/ocaml/issues/12866)をご参照ください。

## iter を多用しすぎると遅くなることがある

(余力ができたら追記します)

うろ覚えなのですが、以前 iter を多用したプログラムを書いたらかなり遅く、
それを for 文で書き直したら早くなったことがありました。

{{< x user="samosica" id="1705531373728256262" >}}

おそらく以下の提出のことだと思います (時系列が逆になっていますが、これは最初に書いた iter を使ったプログラムがうまく動かず、後で書き直したからです)。

<!-- markdownlint-capture -->
<!-- markdownlint-disable MD013 -->

- iter を使って書いた提出: <https://atcoder.jp/contests/abc320/submissions/45785399> (1900 ms)
- for 文で書き直した提出: <https://atcoder.jp/contests/abc320/submissions/45785346> (1360 ms)

<!-- markdownlint-restore -->

簡単にしか調べていない、かつ、調べたのがかなり前なので不確かなのですが、
AtCoder の環境では flambda が有効になっていないために、iter を使ったプログラムの最適化が弱いようです。
上のツイートによると、flambda を有効にしたら[^2]、時間差が縮まったそうです。

[^2]: 記憶違いでなければ、`ocaml-base-compiler`の代わりに`ocaml-variants.4.14.1+options`と`ocaml-option-flambda.1`をインストールしたはずです。これらのパッケージについては[参考資料](#参考資料)をご覧ください。

TLE が厳しい問題では iter の多用しすぎにお気を付けください。

## 処理の途中で出てくる値をイテレーターの形で集める

例えば、グラフを探索しているときに訪れた頂点を記録したいことがあります。
そういうときは次のように可変変数に格納するのが一般的だと思います。

```ocaml
let visited_nodes = ref []
let rec dfs v =
  visited.(v) <- true;
  visited_nodes := v :: !visited_nodes;
  List.iter (fun w ->
    if not visited.(w) then dfs w
  ) al.(v)

let () =
  dfs 1;
  (* 訪れた順にするには反転する必要がある *)
  visited_nodes := List.rev !visited_nodes;
  ...
```

しかし、次のようにイテレーターの形で頂点を集めることもできます。

```ocaml
(* 集めた頂点を後で処理するための関数 k を引数に加える *)
let rec dfs v k =
  visited.(v) <- true;
  (* v を訪れたので k に v を渡す *)
  k v;
  List.iter (fun w ->
    if not visited.(w) then dfs w k
  ) al.(v)
(* iter で使えるようにする *)
let dfs v = Iter.from_iter (dfs v)

let () =
  let visited_nodes = dfs 1 in
  ...
```

このように書くと次のような利点があります。

- 値を集める処理と値を使う処理を分けて書ける。そうすると、二つの処理を同時に考えずに済むので、個人的には頭に優しいと思います。
- 値が得られた順に並ぶ。上の可変変数の例では最後にリストを反転させる必要がありました。
- メモリにすべての値を置かないで処理が行なえ、速度の向上が期待できる。リストや配列の形で保持、操作すると最初の値はもちろん、中間結果もメモリに格納する必要があります。

この方法を使ったプログラムの例をいくつか載せておきます。

<!-- markdownlint-capture -->
<!-- markdownlint-disable MD013 -->

- <https://atcoder.jp/contests/abc350/submissions/52583256> (AtCoder Beginner Contest 350 C)。入れ替える要素の組をイテレーターで持っています。
- <https://atcoder.jp/contests/abc337/submissions/52467430> (AtCoder Beginner Contest 337 D)。ある行 (あるいは列)のある区間をすべて`o`にするために必要な回数をイテレーターで持っています。

<!-- markdownlint-restore -->

## 毎回決まった量加算するループを iter を使って書く

C++ で言うところの`for(int i = l; i < r; i += step){ ... }`は iter を使って次のように書けます[^3]。

[^3]: 元のコードも OCaml のコードも`l`、`r`、`step`がオーバーフローが起こらない程度に小さいと暗に仮定していることにお気を付けください。例えば、OCaml だと`l = 0, r = max_int, step = max_int - 1`のとき、オーバーフローが起こり、`i`が負の数になります。

```ocaml
Iter.iterate ((+) step) l
|> Iter.take_while (fun i -> i < r)
|> Iter.iter (fun i -> ...)
```

iter には`Iter.int_range_by`というぴったりそうな関数がありますが、上のプログラムと異なる動作をするケースがあるので注意が必要です。

```ocaml
let step = 2 in
let l = 0 in
let r = -1 in
(* for(int i = l; i < r; i += step) のつもり *)
(* 何も出力しないでほしいが、実際は 0 を出力する *)
Iter.int_range_by ~step l r
|> Iter.iter (Printf.printf "%d\n")
```

(`step > 0`で)`l >= r`のときは何もしないように条件分岐すれば問題ありませんが、焦っていると忘れてしまうかもしれないので、個人的には最初の方法で書くのがオススメです。

## 未定を None で表現するときの最小値、最大値

最小値 (または最大値)を動的計画法で求めたいとします。
テーブルの初期値には`max_int`や`-1`などの具体的な値を指定することが多いですが、そうすると途中の計算がおかしくならないか気を配る必要があります。
そのため、代わりに`None`を指定して未定とそれ以外を明確に区別することにします。
このとき、テーブルの値は`'a option`になるわけですが、`'a option`の最小値 (または最大値)はどのように計算すればいいでしょうか。

### 最大値

(注意: 以下では実行速度のことはあまり考えていません。記述量だけを考慮しています)

少なくとも AtCoder の環境では`None <= Some v`で、`Some v <= Some w`と`v <= w`が同値なので、単に`max`と書けます[^4]。

[^4]: これが仕様としてドキュメントに明記されているかは不明です。

### 最小値

単に`min`と書くことはできません。色々試してきましたが、結局のところ、次のような関数をあらかじめ定義しておくのが良さそうです[^5]。

[^5]: (`f`が結合律を満たすとき、)`lift ~f`は`f`を演算に持つ半群に単位元を追加して得られるモノイドの演算です。
Haskell を使っている方にはお馴染みかもしれません。

```ocaml
let lift ~f o1 o2 =
  match o1, o2 with
  | None, _ -> o2
  | _, None -> o1
  | Some x1, Some x2 -> Some (f x1 x2)
```

この`lift`を使うと、2つの値の最小値を取る関数は`lift ~f:min`と書けます。

この方法は最大値でも使えます。両方で同じ方法を使えば書き方を迷う時間を減らせます。
さらには、一般の二項演算でも使えて汎用性が高いです。

## 特定の型に特化したハッシュテーブルを使う

多相的なハッシュテーブル (`Hashtbl.t`)だと遅くて困るときは使用する型に特化したハッシュテーブルを使うと速くなるかもしれません。

例えば、キーが`int`のハッシュテーブルは

```ocaml
Base.Hashtbl.create ~size:n (module Base.Int)
```

で作成できます。

また、`Hashtbl.Make`を使っても作成できます。

```ocaml
(* バージョン 5.1 以降では Int.hash があるので単に Int と書けます。 *)
module Int_tbl = Hashtbl.Make (Base.Int)

Int_tbl.create n
```

[AtCoder Beginner Contest 363 C - Avoid K Palindrome 2](https://atcoder.jp/contests/abc363/tasks/abc363_c)の解法で簡単に試したところ、

- `Base.Hashtbl`を使ったプログラムが一番速かった。
- `Hashtbl.Make`を使ったプログラムはその約1.65倍。
- 普通の`Hashtbl`を使ったプログラムは約2.28倍。

(もちろん精査は必要ですが、)速度に困ったらとりあえず初めに`Base.Hashtbl`を使えば良さそうです。

## 参考資料

- [OCaml library : Scanf](https://ocaml.org/manual/5.0/api/Scanf.html)
- [OCaml library : Sys](https://ocaml.org/manual/5.0/api/Sys.html#VALint_size)
- [AtCoder 2023/1 Language Update](https://docs.google.com/spreadsheets/d/1HXyOXt5bKwhKWXruzUvfMFHQtBxfZQ0047W7VVObnXI/edit#gid=0)
- [Try a new layout for compiler flags for OCaml 4.12.0 (and add 4.12.0~alpha1) by AltGr · Pull Request #17541 · ocaml/opam-repository](https://github.com/ocaml/opam-repository/pull/17541)
- [How to use Flambda with dune in ocaml? - Stack Overflow](https://stackoverflow.com/questions/70665781/how-to-use-flambda-with-dune-in-ocaml)
- [Experimental new layout for the ocaml-variants packages in opam-repository - Ecosystem - OCaml](https://discuss.ocaml.org/t/experimental-new-layout-for-the-ocaml-variants-packages-in-opam-repository/6779)
- [Iterators And Streams | OCamlverse](https://ocamlverse.net/content/iterators.html)
