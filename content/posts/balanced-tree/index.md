---
title: "木が再帰的に定義されているときの重心分解"
date: 2023-03-07T17:30:00+09:00
draft: false
math: false
description: "もうちょっと詳しく: 木を`type 'a tree = T of 'a * 'a tree list`の形で表現すると、その重心分解が結構綺麗に書けます。"
---

### もうちょっと詳しく
木を`type 'a tree = T of 'a * 'a tree list`の形で表現する[^1]と、その重心分解が結構綺麗に書けます。

[^1]:このように表現された木はrose treeと呼んだりするそうです ([Rose tree - Wikipedia](https://en.wikipedia.org/wiki/Rose_tree))

### 背景
[Balanced Tree (AtCoder Beginner Contest 291 Ex)](https://atcoder.jp/contests/abc291/tasks/abc291_h)は木を再帰的に重心分解する問題でした。
重心分解の実装でよく見かけるのは隣接リストで表現された木に対するものですが、再帰的に定義された木を使った方がその再帰構造が活きて、分かりやすい実装になるのではないかと思ったので試してみました。

### 実装
最初に再帰的に定義された木を用いて問題を解くプログラムを示します。実装言語はOCamlです。

```ocaml
(* 番号づけられた頂点を持つ木 *)
(* T(i, v, ts) は根の番号が i、格納している値が v で、その下にある部分木のリストが ts である木を表す *)
type 'a indexed_tree = T of int * 'a * 'a indexed_tree list

let root_index (T(i, _, _)) = i
let root_value (T(_, v, _)) = v
let subtrees (T(_, _, ts)) = ts

(* 隣接リストから indexed_tree を構築する関数 *)
(* al はグラフの隣接リストで、al.(i) は i 番目の頂点と隣接する頂点の番号のリスト *)
let dfs_tree al =
  let rec dfs p i =
    T(i, (), List.filter_map (fun j -> if j = p then None else Some (dfs i j)) al.(i)) in
  dfs (-1) 0

(* 各頂点にそれを根とする部分木のサイズを格納した木を返す関数 *)
let rec size_tree t =
  let ts = List.map size_tree (subtrees t) in
  let count = List.fold_left (fun c t -> c + root_value t) 1 ts in
  T(root_index t, count, ts)

(* 重心分解を行う関数 *)
let centroid_decomp t =
  (*  t: いま注目している木 *)
  (* tt: t の上側にあった木のリスト *)
  (*  n: t と tt を合わせた木のサイズ *)
  (* Note: tt のサイズは常に 1 以下になります。そのため、list の代わりに option を使ってもいいですが、 *)
  (*       list の方がきれいに書けます。この小技は時々見ます *)
  let rec decomp t tt n =
    (* N.B. bigger のサイズは常に 1 以下 *)
    let (smaller, bigger) = List.partition (fun t -> root_value t * 2 <= n) (subtrees t) in
    match bigger with
    | t' :: _ ->
      let ts' = tt @ smaller in
      (* t' とそれ以外に分ける *)
      decomp t' [T(root_index t, n - root_value t', ts')] n in
    | [] ->
      T(root_index t, (), List.map (fun t -> decomp t [] (root_value t)) (tt @ subtrees t))
  decomp t [] (root_value t)

(* 木の各頂点の親を格納した配列を返す関数 *)
let parent_list_of_tree n t =
  let pl = Array.make n 0 in
  let rec dfs p (T(i, _, ts)) =
    pl.(i) <- p;
    List.iter (fun t -> dfs i t) ts in
  dfs (-1) t;
  pl

let () =
  let n = Scanf.scanf " %d" Fun.id in
  let al = Array.make n [] in
  let () =
    for i = 1 to n - 1 do
      Scanf.scanf " %d %d" (fun a b -> 
        (* 番号を 0 始まりにする *)
        let a = a - 1 in
        let b = b - 1 in
        al.(a) <- b :: al.(a);
        al.(b) <- a :: al.(b))
    done in
  let pl =
    al
    |> dfs_tree (* 隣接リストを indexed_tree に変換 *)
    |> size_tree (* すべての部分木のサイズを計算 *)
    |> centroid_decomp (* 重心分解 *)
    |> parent_list_of_tree n (* indexed_tree から各頂点の親の配列に変換 *) in
  for i = 0 to n - 1 do
    let p = pl.(i) in
    (* 番号を 1 始まりに戻す *)    
    let p = if p >= 0 then p + 1 else p in
    print_int p;
    if i < n - 1 then
      print_char ' '
    else
      print_newline()
  done
```

`centroid_decomposition`関数は一般的な実装と同じく次の手順で重心分解を行います。
1. 最初は木全体に注目する
2. 注目している木の根の下に`(木のサイズ) * 2 > (全体の木のサイズ)`を満たす部分木が存在したら、その木を新たに注目する木とする。このとき、上側にある木を更新する。
3. そのような木がなくなったら、注目している木の根を重心として、それに隣接する部分木（上側の木を含む）に対して重心分解を行う。
4. (2), (3)を繰り返す

{{< figure src="nonempty-bigger.png" alt="" position="center" caption="(2)の操作" captionPosition="center" >}}

{{< figure src="empty-bigger.png" alt="Hello Friend" position="center" caption="(3)の操作" >}}

プログラムでは`bigger = t' :: _`のケースが(2)に対応し、`bigger = []`のケースが(3)に対応します。これらのコード片は上の図を素直に表現したものになっています。

### 比較
次に比較対象として隣接リストで表現した木をそのまま用いて問題を解くプログラムを示します。

```ocaml
(* 各頂点を根とする部分木のサイズを格納した配列を返す関数 *)
(* al はグラフの隣接リストで、al.(i) は i 番目の頂点と隣接する頂点の番号のリスト *)
let subtree_size al =
  let ss = Array.make (Array.length al) 1 in
  let rec loop p i =
    List.iter (fun j ->
      if j <> p then begin
        loop i j;
        ss.(i) <- ss.(i) + ss.(j)
      end
    ) al.(i) in
  let () = loop (-1) 0 in
  ss

(* 重心分解を行う関数 *)
(* 戻り値 pl は重心分解で得られる木において i の親が pl.(i) であることを表す *)
(* al はグラフの隣接リスト、ss は subtree_size から得られる部分木のサイズを格納した配列 *)
let centroid_decomp al ss =
  let pl = Array.make (Array.length al) (-2) in
  (*  p: 直前に訪れた頂点 *)
  (*  i: いま訪れている頂点 *)
  (* pc: 1つ前に見つけた重心 *)
  (*  n: 全体の木のサイズ *)
  let rec decomp p i pc n =
    (* j <> p: 戻らない *)
    (* pl.(j) = -2: すでに見つけた重心は無視する *)
    let j = List.find_opt (fun j -> j <> p && pl.(j) = -2 && ss.(j) * 2 > n) al.(i) in
    match j with
    | Some j ->
      ss.(i) <- n - ss.(j);
      decomp i j pc n
    | None ->
      pl.(i) <- pc;
      List.iter (fun j -> if pl.(j) = -2 then decomp i j i ss.(j)) al.(i) in
  let () = decomp (-1) 0 (-1) (Array.length al) in
  pl

let () =
  let n = Scanf.scanf " %d" Fun.id in
  let al = Array.make n [] in
  let () =
    for i = 1 to n - 1 do
      Scanf.scanf " %d %d" (fun a b ->
        (* 番号を 0 始まりにする *)
        let a = a - 1 in
        let b = b - 1 in
        al.(a) <- b :: al.(a);
        al.(b) <- a :: al.(b))
    done in
  let pl = subtree_size al |> centroid_decomp al in
  for i = 0 to n - 1 do
    let p = pl.(i) in
    (* 番号を 1 始まりに戻す *)
    let p = if p >= 0 then p + 1 else p in
    print_int p;
    if i < n - 1 then
      print_char ' '
    else
      print_newline()
  done
```

このプログラムも十分分かりやすいのではないかと思うかもしれませんが、個人的には訪れていい頂点の条件が若干腑に落ちない感じがします。
その原因を辿ると、一次元的な配列の上で木を扱っていて、木が本来持っている構造が見えづらくなっていることが原因であるように思います。
ただもしかすると、実装が下手なだけで、うまく実装すれば問題ない可能性はあります。

上記2つのプログラムをAtCoderに提出しました。その結果は以下の通りです。
- 再帰的に定義された木を用いる: 215 ms (https://atcoder.jp/contests/abc291/submissions/39381986)
- 隣接リストで表現された木をそのまま用いる: 141 ms (https://atcoder.jp/contests/abc291/submissions/39381925)

前者は後者の1.5倍の時間がかかりました。この差の主な要因は後者が重心分解で得られる木を実際に構築していないことだと思われます。
なお、問題の時間制限は2秒なのでどちらも余裕があります。

### 終わりに
本記事では再帰的に定義された木に対する重心分解を実装しました。
今回のように木を代数的データ型で表現すると、それに対する操作が分かりやすく書けることがあります。
そのような機会があれば是非OCamlやHaskellなどの代数的データ型とパターンマッチの機能を備えた言語で書いてみてください。