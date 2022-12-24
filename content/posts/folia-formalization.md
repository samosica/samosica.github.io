---
title: "Foliaを徹底検証する"
date: 2022-12-24T21:37:04+09:00
draft: false
math: true
---

今年もクリスマスの時期がやってきました。この時期は全国各地で巨大なクリスマスツリー🎄が飾られていることと思います。
ツリーで思い出したのですが、AtCoderで2020年に出題された[Folia](https://atcoder.jp/contests/nomura2020/tasks/nomura2020_c)という問題の解法をCoqで形式検証していたのでその話を書きます。

すべてのソースコードは[ここ](https://github.com/samosica/folia-formalization/blob/main/Folia.v)にあります。

### 問題
元の問題文は
* https://atcoder.jp/contests/nomura2020/tasks/nomura2020_c

にあります。行なった検証ではこれを一般化した次の問題を考えました。
>非負整数 $n$ と非負整数の有限列 $s = (s_0, \dots, s_N)$ が与えられる。次の条件を満たす**森**が存在するか判定せよ。
>* 条件1: $n$ 個の二分木から構成される
>* 条件2: すべての $i = 0, \dots, N$ について、深さ $i$ の頂点がちょうど $s_i$ 個存在する
>
>さらに、もし存在するならば、そのような森の頂点数の**最小値と**最大値を計算せよ。

変更点は二分木を森に変えたこと、頂点数の最大値だけでなく最小値も計算することです。

なぜ森に変更したかというと、解法の正当性を証明するために必要だからです。
もし、元の問題のままで解法の正当性を $s$ に関する構造帰納法で示そうとすると、$s = s_0 :: s' $ のケースで使える帰納法の仮定は深さ1より下の層に関するものですが、これらの層が単一の二分木を形成するとは限らないので帰納法の仮定が使えません。
そこで、森に一般化することで帰納法の仮定を強め、帰納法が回るようにしています。

また、頂点数の最小値を考えるのは最小値、最大値を端点に持つ区間について考えたいからです。すぐ後で述べますが、この区間内の任意の整数は条件を満たす森の頂点数として実現可能であることが示せます。

### 扱う解法
Foliaの解法にはいくつかのバリエーションがあるのですが、その中で検証したのはボトムアップの計算とトップダウンの計算を組み合わせた解法です。
ちなみにこの解法は[公式の解説動画](https://youtu.be/NuhtAfH5SCc)と同じものです。また、[公式Editorial](https://img.atcoder.jp/nomura2020/editorial.pdf)ではトップダウンの計算のみを行なう解法が説明されています。

以下では問題のリンク先にある入力例1（$n = 1, N = 3, s = (0, 1, 1, 2)$）を使って解法を説明します。
* 手順1: `s`を下から上に見て、各深さで可能な頂点数の範囲を計算する
  + 下から見るので、各深さではその深さとそれより下の層の条件のみを考慮します。上の層の条件、特に条件1はここでは考慮しません。
  + 深さ3: ちょうど2個の頂点しか置けないので$[2, 2]$
  + 深さ2: 葉の頂点はちょうど1個必要。一方、深さ3には必ず2個の頂点があるので、葉でない頂点は最小1個（2個の頂点を子として持つ）、最大2個（2個の頂点を1つずつ子として持つ）。よって、$[1 + 1, 1 + 2] = [2, 3]$
  + 深さ1: 葉の頂点はちょうど1個必要。一方、深さ2には2から3個の頂点が置けるので、葉でない頂点は最小1個（深さ2に2個頂点を置いて、その上に1個置く）、最大3個（深さ2に3個頂点を置いて、それぞれの上に1個ずつ置く）。よって、$[1 + 1, 1 + 3] = [2, 4]$
  + 深さ0: 深さ1と同様の計算により$[1, 4]$
  + $n$ は $[1, 4]$ に含まれるので条件を満たす木が存在することが分かります。
* 手順2: `s`を上から下に見て、各深さで可能な頂点数の範囲を計算する。
  + 上から見るので、各深さではそれより上の層の条件のみを考慮します。
  + 深さ0: ちょうど $n$ 個の頂点しか置けないので $[1, 1]$
  + 深さ1: 深さ0には葉でない頂点が必ず $1 - s_0 = 1$ 個あるので、最小1個（下に1個置く）、最大2個（下に2個置く）。つまり、$[1, 2]$
  + 深さ2: 深さ1には葉でない頂点を $0\ (= 1 - s_1)$ から $1\ (= 2 - s_1)$ 個置けるので、最小0個、最大2個。つまり、$[0, 2]$
  + 深さ3: 同様の計算により $[0, 2]$
* 手順3: 手順1、2で得られた範囲の共通部分を取り、すべての条件を考慮したときの頂点数の範囲を求める
  + 深さ0: $[1, 4] \cap [1, 1] = [\max(1, 1), \min(4, 1)] = [1, 1]$
  + 深さ1: $[2, 4] \cap [1, 2] = [2, 2]$
  + 深さ2: $[2, 3] \cap [0, 2] = [2, 2]$
  + 深さ3: $[2, 2] \cap [0, 2] = [2, 2]$
  + したがって、条件を満たす木の頂点数の最小値、最大値はともに7であることが分かります

### やったこと
前節で説明した解法をCoqで形式化し、その正しさを検証しました。
すべてのソースコードは[ここ](https://github.com/samosica/folia-formalization/blob/main/Folia.v)にあります。作業の流れは以下の通りです。
* (Step 1) 手順1の方法を使って深さ0にある頂点の個数（= 森を構成する木の個数）の最小値、最大値を計算する関数`lower_bound_bottomup`、`upper_bound_bottomup`を定義する
* (Step 2) `lower_bound_bottomup`、`upper_bound_bottomup`が本当に最小値、最大値を計算することを証明する。実際にはより強い次の主張を示しています。
  + すべての条件を満たす森が存在するための必要十分条件は`lower_bound_bottomup s <= n <= upper_bound_bottomup s`が成り立つことである
* (Step 3) 手順2、3を融合させた方法を使って各深さにある頂点の個数の最小値、最大値を計算する関数`lower_bounds_backforth`、`upper_bounds_backforth`を定義する。そして、これらの関数を使ってすべての頂点の個数の最小値、最大値を計算する関数`lower_bound_total`、`upper_bound_total`を定義する
* (Step 4) `lower_bound_total`、`upper_bound_total`が本当に最小値、最大値を計算することを証明する。実際にはより強い次の主張を示しています。
  + すべての条件を満たす森が存在すると仮定する。このとき、すべての条件を満たしていて、かつ、頂点数が`m`である森が存在するための必要十分条件は`lower_bound_total s n <= m <= upper_bound_total s n`が成り立つことである
* (Step 5) `lower_bound_total`、`upper_bound_total`を高速化する。元の関数が $\Theta(|s|^2)$ であるのを $\Theta(|s|)$ に改善する（ただし、$|s|$ は列 $s$ の長さを表す）。
* (Step 6) 最後に検証済みの関数を使って元の問題を解くプログラムを作成する。入出力以外は検証済みなので、（入出力部分が間違っていたり、言語処理系のバグを踏んだりしていなければ）提出なしに作成したプログラムがACを得ることを確信できます。

以下では各ステップについて簡単に説明します。

### Step 0: 二分木と森を定義する
二分木は根の子の個数でコンストラクタを分けて定義します。
```
Inductive bintree := L | B1 of bintree | B2 of bintree & bintree.
```

森は二分木の有限列として定義します。
```
Definition forest := seq bintree.
```

そして、森が条件2を満たすか判定する関数を定義します。
```
Fixpoint satisfy_leave_spec (f : forest) (s : seq nat) :=
  match s with
    [::] => f == [::]
  | l0 :: s' =>
      let f' := subforest f in
      (count_mem L f == l0) && satisfy_leave_spec f' s'
  end.
```

### Step 1: 深さ0にある頂点の個数の最小値、最大値を計算する関数を定義する
手順1の計算は`foldr`を使って書くことができ、深さ0にある頂点の個数の最小値、最大値を計算する関数は次のように書けます。
```
(* 最小値を計算する関数 *)
Definition lower_bound_bottomup (s : seq nat) :=
  foldr (fun l0 lb => l0 + uphalf lb) 0 s.

(* 最大値を計算する関数 *)
Definition upper_bound_bottomup (s : seq nat) :=
  foldr (fun l0 ub => l0 + ub) 0 s.
```

### Step 2: Step 1の関数が本当に最小値、最大値を計算することを証明する
実際にはより強い次の主張を示します。
```
Proposition in_bottomup_boundP (n : nat) (s : seq nat) :
  reflect (exists2 f, size f = n & satisfy_leave_spec f s) (lower_bound_bottomup s <= n <= upper_bound_bottomup s).
```

自然言語に翻訳すると、
* すべての条件を満たす森が存在するための必要十分条件は`lower_bound_bottomup s <= n <= upper_bound_bottomup s`が成り立つことである

です。

証明で重要なのは「$m$ 個の木を持つ森があったとき、その上にいくつかの頂点を追加することで深さを1だけ大きくして、$\lceil \frac{m}{2} \rceil$ 個の木を持つ森から $m$ 個の木を持つ森までをすべて作れる」ことです。これは適切な個数だけ木のペアを作ることで可能です。

### Step 3: 全頂点数の最小値、最大値を計算する関数を定義する
最初に各層の頂点数の最小値、最大値を計算する関数を定義します。
```
Fixpoint lower_bounds_backforth (s : seq nat) (n : nat) :=
  match s with
    [::] => [::]
  | l0 :: s' =>
      n :: lower_bounds_backforth s' (maxn (lower_bound_bottomup s') (n - l0))
  end.

Fixpoint upper_bounds_backforth (s : seq nat) (n : nat) :=
  match s with
    [::] => [::]
  | l0 :: s' =>
      n :: upper_bounds_backforth s' (minn (upper_bound_bottomup s') (n - l0).*2)
  end.
```

これらの関数は帰納法を回しやすくするためにあえて非効率な方法で計算を行なっています。実際、`s`のすべての接頭辞に対して、`lower_bound_bottomup`、`upper_bound_bottomup`を呼び出しているので、要素を見る回数は $1 + \dots + |s| = \frac{|s|(|s| + 1)}{2}$ となり、時間計算量が $\Theta(|s|^2)$ であることが分かります。`lower_bounds_backforth`、`upper_bounds_backforth`の高速化についてはStep 5をご覧ください。

次に全頂点数の最小値、最大値を計算する関数を定義します。これは単に最初に定義した関数を使って各層の頂点数の最小値、最大値を求め、その総和を計算すればいいです。
```
Definition lower_bound_total s n :=
  sumn (lower_bounds_backforth s n).

Definition upper_bound_total s n :=
  sumn (upper_bounds_backforth s n).
```

### Step 4: Step 3の関数が本当に最小値、最大値を計算することを証明する
実際にはより強い次の命題を示します。
```
Proposition in_total_boundP (n m : nat) (s : seq nat) :
  lower_bound_bottomup s <= n <= upper_bound_bottomup s ->
  reflect (exists f, [/\ count_node_forest f = m, size f = n & satisfy_leave_spec f s]) (lower_bound_total s n <= m <= upper_bound_total s n).
```

この命題の主張は
* `lower_bound_bottomup s <= n <= upper_bound_bottomup s`（Step 2で示した命題からこれはすべての条件を満たす森が存在することと同値）であるとき、すべての条件を満たす、かつ、頂点数が[$ m]である森が存在するための必要十分条件は`lower_bound_total s n <= m <= upper_bound_total s n`が成り立つことである
です。

証明の鍵となるのは次の事実です。
* 区間`[lower_bound_total s n, upper_bound_total s n] (lower_bound_bottomup s <= n <= upper_bound_bottomup s)`は区間`[lower_bound_total s (lower_bound_bottomup s), upper_bound_total s (upper_bound_bottomup s)]`を覆う

### Step 5: 最小値、最大値の計算を高速化する
Step 3で定義した`lower_bounds_backforth`、`upper_bounds_backforth`を高速化します。
Step 3では手順2、3を同時に行なっていましたが、これらを別々に行ないます。

まず、手順2の計算は`scanl`（MathCompで定義されている）を使って次のように書けます。
```
Definition lower_bounds_topdown (s : seq nat) (n : nat) :=
  belast n (scanl subn n s).

Definition upper_bounds_topdown (s : seq nat) (n : nat) :=
  belast n (scanl (fun ub l0 => (ub - l0).*2) n s).
```


次に、すべての層について手順1の計算を行なうのは`scanr`（Haskellにある）を使って書けます。
しかし、`scanr`はMathCompでは定義されていないので、自分で定義する必要があります。
Haskellでは部分関数が許されますが、Coqではリジェクトされるため、Coqにおける`scanr`の定義は次のように少しテクニカルになります。

```
Fixpoint scanr_aux (s : seq T) : {r : seq S | size r > 0} :=
  match s with
    [::] => exist _ [:: y0] erefl
  | x :: s' =>
      match scanr_aux s' with
        exist r Hr =>
          (match r return size r > 0 -> {r : seq S | size r > 0} with
             [::] => fun cont => match notF cont with end
           | y :: _ => fun Hr => exist _ (f x y :: r) erefl
           end) Hr
      end
  end.

Definition scanr (s : seq T) := proj1_sig (scanr_aux s).
```

`scanr`を用いると、すべての層について手順1の計算を行なう関数は次のように定義できます。
```
Definition lower_bounds_bottomup s :=
  scanr (fun l0 lb : nat => l0 + uphalf lb) 0 s.

Definition upper_bounds_bottomup s :=
  scanr (fun l0 ub : nat => l0 + ub) 0 s.
```

最後に手順3の計算を行なう関数を次のように定義します。
```
Definition map2 (f : A -> B -> C) :=
  fix map2 (s1 : seq A) (s2 : seq B) :=
    match s1, s2 with
      x :: s1', y :: s2' => f x y :: map2 s1' s2'
    | _, _ => [::]
    end.

Definition lower_bounds_backforth' s n :=
  map2 maxn (lower_bounds_bottomup s) (lower_bounds_topdown s n).

Definition upper_bounds_backforth' s n :=
  map2 minn (upper_bounds_bottomup s) (upper_bounds_topdown s n).
 
Definition lower_bound_total' s n :=
  sumn (lower_bounds_backforth' s n).

Definition upper_bound_total' s n :=
  sumn (upper_bounds_backforth' s n).
```

その後、Step 3で定義した関数とStep 5で定義した関数が等価であることを示しました。詳しくはソースコードの`lower_bounds_backforth_equiv`、`upper_bounds_backforth_equiv`、`lower_bound_total_equiv`、`upper_bound_total_equiv`をご覧ください。

### Step 6: 検証済みの関数を使って提出するプログラムを作成する
最後にこれまでに検証した関数を使って元の問題を解くOCamlのプログラムを作成します。

まず、次のように記述して、CoqのプログラムをOCamlのプログラムに変換します。
```
Require Extraction.
Extract Inductive list => "list" [ "[]" "( :: )" ].
Extract Inductive nat => "int" [ "0" "succ" ] "(fun fO fS n -> if n = 0 then fO () else fS (n - 1))".
Extract Inlined Constant addn => "( + )".
Extract Inlined Constant subn => "( - )".
Extract Inlined Constant maxn => "max".
Extract Inlined Constant minn => "min".
Extract Inlined Constant double => "(fun n -> n * 2)".
Extract Inlined Constant half => "(fun n -> n / 2)".
Extract Inlined Constant uphalf => "(fun n -> (n + 1) / 2)".
Extraction Inline scanr_aux.
Extraction "folia" lower_bound_bottomup upper_bound_total'.
```

そうすると、`folia.ml`に変換されたプログラムが出力されます。これに入出力の処理を加えたプログラムを以下に示します。
{{< code language="ocaml" title="solution.ml" id="1" expand="Show" collapse="Hide" isCollapsed="true" >}}
(* -- Converted from Coq -- *)

type __ = Obj.t

type bool =
| True
| False



type reflect =
| ReflectT
| ReflectF

type 't pred = 't -> bool

type 't rel = 't -> 't pred

module Equality =
 struct
  type 't axiom = 't -> 't -> reflect

  type 't mixin_of = { op : 't rel; mixin_of__1 : 't axiom }

  (** val op : 'a1 mixin_of -> 'a1 rel **)

  let op m =
    m.op

  type coq_type =
    __ mixin_of
    (* singleton inductive, whose constructor was Pack *)

  type sort = __

  (** val coq_class : coq_type -> sort mixin_of **)

  let coq_class cT =
    cT
 end

(** val belast : 'a1 -> 'a1 list -> 'a1 list **)

let rec belast x = function
| [] -> []
| x' :: s' -> x :: (belast x' s')

(** val foldr :
    ('a1 -> 'a2 -> 'a2) -> 'a2 -> 'a1 list -> 'a2 **)

let rec foldr f z0 = function
| [] -> z0
| x :: s' -> f x (foldr f z0 s')

(** val sumn : int list -> int **)

let sumn =
  foldr ( + ) 0

(** val scanl :
    ('a1 -> 'a2 -> 'a1) -> 'a1 -> 'a2 list -> 'a1 list **)

let rec scanl g x = function
| [] -> []
| y :: s' -> let x' = g x y in x' :: (scanl g x' s')

(** val map2 :
    ('a1 -> 'a2 -> 'a3) -> 'a1 list -> 'a2 list -> 'a3 list **)

let rec map2 f s1 s2 =
  match s1 with
  | [] -> []
  | x :: s1' ->
    (match s2 with
     | [] -> []
     | y :: s2' -> (f x y) :: (map2 f s1' s2'))

(** val scanr :
    ('a1 -> 'a2 -> 'a2) -> 'a2 -> 'a1 list -> 'a2 list **)

let rec scanr f y0 = function
| [] -> y0 :: []
| x :: s' ->
  let r = scanr f y0 s' in
  (match r with
   | [] -> assert false (* absurd case *)
   | y :: _ -> (f x y) :: r)

type leave_spec = int list

(** val lower_bound_bottomup : leave_spec -> int **)

let lower_bound_bottomup s =
  foldr (fun l0 lb -> ( + ) l0 ((fun n -> (n + 1) / 2) lb))
    0 s

(** val upper_bounds_topdown :
    leave_spec -> int -> int list **)

let upper_bounds_topdown s n =
  belast n
    (scanl (fun ub l0 -> (fun n -> n * 2) (( - ) ub l0)) n s)

(** val upper_bounds_bottomup : int list -> int list **)

let upper_bounds_bottomup s =
  scanr ( + ) 0 s

(** val upper_bounds_backforth' :
    int list -> int -> int list **)

let upper_bounds_backforth' s n =
  map2 min (upper_bounds_bottomup s)
    (upper_bounds_topdown s n)

(** val upper_bound_total' : int list -> int -> int **)

let upper_bound_total' s n =
  sumn (upper_bounds_backforth' s n)
(* ------------------------ *)

let solve n a =
  if lower_bound_bottomup a = 1 then
    upper_bound_total' a 1
  else
    -1

let n = Scanf.scanf " %d" Fun.id
let a = List.init (n + 1) (fun _ -> Scanf.scanf " %d" Fun.id)
let () = Printf.printf "%d\n" (solve n a)
{{< /code >}}

入出力部分は短く、誤りが混入しているようには見えません。また、それ以外はCoqで検証されている関数なので、提出しなくても正しく動作していると確信できます。そのため、提出はせずに終わります🦥。
