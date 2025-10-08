---
title: "AtCoderでLeanを試す (1)"
date: 2025-10-11T10:00:00+09:00
lastmod: 2025-10-11T10:00:00+09:00
draft: false
math: false
toc: true
description: "2024年11月から進められてきた AtCoder の言語処理系の更新作業が一段落つき、いよいよ試験運用が始まりました。
今回の更新ではなんと定理証明支援系である Lean が追加される予定です。
そこで、とりあえず証明は抜きに Lean でのプログラムの書き方を確認しつつ、問題を解いていきます。"
---

2024年11月から進められてきた AtCoder の言語処理系の更新作業が一段落つき、いよいよ試験運用が始まりました。
今回の更新ではなんと定理証明支援系である [Lean] が追加される予定です。作業に携わった方々、ありがとうございます。

競技プログラミングと定理証明支援系の組み合わせに興味があり、Rocq (旧称 Coq)で解法の形式検証をしたことがある人間としては[^1]
見逃せないイベントなので、Lean の勉強を始めました。

[Lean]: <https://lean-lang.org>
[^1]: [Foliaを徹底検証する](https://samosica.github.io/posts/folia-formalization/)

もちろん最終的には解法に証明を付けたいですが、最初からきっちりやるのは大変です。
やったことがある方は共感できると思いますが、頭の中では数分でできる推論過程を厳密に書き下そうとしたら数日かかってしまう
ということが十分ありえます(それだけで済めばいい方という考えもあります)。

それでは挫折しかねないので、とりあえず証明は抜きに基本的なプログラムの書き方を確認しつつ、問題を解いていきます。

<!--more-->

## 問題を解くために知っているといい知識

問題を解くために最低限知っているとよさそうなことをまとめました。

筆者は Lean の初心者であること、まだ十数問しか解いていないことにご留意ください。
可能な限り確認をしましたが、誤りがある可能性があります。また、色々と抜けていることがあると思います。

### Leanが使える場所

2025年10月9日時点で Lean が使える AtCoder のコンテストは以下の通りです。

- [Language Test 202505](https://atcoder.jp/contests/language-test-202505)
- [AtCoder Daily Training](https://atcoder.jp/contests/adt_top) のコンテスト

### エディタ

Lean を書くためのエディタは Visual Studio Code (VSCode)が機能が揃っていていいです。
Lean と Lean の VSCode 拡張機能の導入方法については [Install — Lean Lang] を参照してください。

[Install — Lean Lang]: <https://lean-lang.org/install/manual/>

以降の説明では VSCode の拡張機能を使っていて、Lean の導入が済んでいることを仮定します。

### VSCodeの拡張機能

Lean の VSCode 拡張機能の使い方は [Lean 4 VS Code Extension Manual] で確認できます。
このドキュメントは VSCode からも見られます。VSCode で適当なファイルを開くと右上に「∀」のアイコンが現れるので
クリックし、Documentation → Show Manual を選択すると表示されます。

とりあえず覚えておくとよさそうなのは

- 型や関数を検索できる Loogle[^2] の開き方: 「∀」のアイコンをクリックし、Search With Loogle をクリックする。
- 記号の入力方法: 「∀」のアイコンをクリックし、Documentation → Show Unicode Input Abbreviations を選択すると、
  入力方法の一覧が表示される。

  例えば、`→`は`\r`の後にタブキーを押すことで入力できます。
  ちなみにタブキーの代わりにスペースキーや矢印キーを押すことでも入力できますが、
  余計な文字が入ったり、位置がずれたりするので使い勝手が悪いです。
- プログラムの情報を表示する InfoView の開き方: `.lean`ファイルを開くと自動で開きます。
  開閉を切り替えるには「∀」のアイコンをクリックし、Toggle InfoView を選択します。
  キーボードからは Ctrl + Shift + Enter を押すことで切り替えられます。

[Lean 4 VS Code Extension Manual]: <https://github.com/leanprover/vscode-lean4/blob/master/vscode-lean4/manual/manual.md>
[^2]: ブラウザからも利用できます: [Loogle!](https://loogle.lean-lang.org)

### AtCoderと同じ環境を用意する

AtCoder で使える Lean のバージョンは v4.22.0 です。また、以下のライブラリが使えます。

- [leanprover-community/mathlib][mathlib]: 数学の定義、定理がたくさん収められているライブラリ
- [pandaman64/lean-regex][lean-regex]: 正規表現のライブラリ
- [fgdorais/Parser][Parser]: パーサーコンビネータのライブラリ

[mathlib]: <https://reservoir.lean-lang.org/@leanprover-community/mathlib>
[lean-regex]: <https://reservoir.lean-lang.org/@pandaman64/lean-regex>
[Parser]: <https://reservoir.lean-lang.org/@fgdorais/Parser>

Lean は更新間隔が短く、バージョン間の違いが少なくないため、手元の環境を AtCoder の環境と揃えておいた方がいいです。
AtCoder と同じ環境を構築する方法の一例を以下に示します。

1. `atcoder/`ディレクトリを作成し、カレントディレクトリにする。
2. `lake +v4.22.0 init atcoder exe`を実行する[^3]。
3. `lakefile.toml`に以下の記述を追加する。

    ```toml
    [[require]]
    name = "mathlib"
    scope = "leanprover-community"
    rev = "v4.22.0"
    
    [[require]]
    name = "Regex"
    git = "https://github.com/pandaman64/lean-regex"
    rev = "v4.22.0"
    subDir = "regex"
    
    [[require]]
    name = "Parser"
    scope = "fgdorais"
    rev = "617f4fa5c48f35076274d57546884261560f1285"
    ```

4. `lake update`を実行し、ライブラリをインストールする。完了までに時間がかかります。
   Mathlib に関してはビルドを高速化するキャッシュも一緒にインストールされます。

最後までやると、ディレクトリ内は次のようになります。

```text
.
├── .git
├── .github
├── .gitignore
├── .lake
├── Main.lean
├── README.md
├── atcoder
│   └── Basic.lean
├── atcoder.lean
├── lake-manifest.json
├── lakefile.toml
└── lean-toolchain
```

手っ取り早くコードが書きたければ、`Main.lean`に書くといいです。
ですが、先に用途や好みに合わせてカスタマイズを行った方がいいと思います。
例えば、コンテストのディレクトリであれば、`A.lean`、`B.lean`、…というファイルを作ると良さそうです。

[^3]: 似たコマンドに`lake new`があります。`lake init`はカレントディレクトリにファイルを配置しますが、
  `lake new`は新しいディレクトリを作成したうえで、そのディレクトリにファイルを配置するという違いがあります。

### プログラムを実行する

[lakeコマンド]や VSCode の拡張機能によって作成されたディレクトリでは`lake exe (実行ファイル名)`で
プログラムを実行できます。

実行ファイル名は`lakefile.toml`で確認できます。

```toml
# lakefile.toml の例
# …
[[lean_exe]]
name = "atcoder"
root = "Main"
```

この例だと`atcoder`という実行ファイルが定義されていて、`lake exe atcoder`で実行できます。

[lakeコマンド]: <https://lean-lang.org/doc/reference/4.22.0/Build-Tools-and-Distribution/Lake/#lake>

### プログラムのエントリーポイント

エントリーポイントとなる関数は多くの言語と同じで`main`です。

```lean
def main : IO Unit := IO.println "こんにちは！"
```

`IO.println`は標準出力に値を出力する関数です。
多くの言語では引数をカンマで区切り、括弧で囲いますが(例: `f(x1, x2, x3)`)、
Lean では括弧で囲わず、スペース区切りで与えます。

複数のアクションを行いたいときは`do`を付けます。
`do`はモナド値(ここでのモナドは`IO`)の計算を合成するための構文糖衣ですが (万人向けの説明が思いつきませんでした)、
モナドなんて知らないぞという方はとりあえず気にしなくて大丈夫です。

```lean
def main : IO Unit := do
  IO.println "こんにちは！"
  IO.println "Lean!"
```

### 基本的なデータ型

真偽値、数値、文字列などが使えます。

```lean
def main : IO Unit := do
  -- 注意: ざっくり見ることを想定しています

  -- 文字列 (`String`)
  IO.println "---------- String ----------"
  IO.println ("Welcome to " ++ "AtCoder") -- Welcome to AtCoder
  IO.println (String.startsWith "AtCoder" "At") -- true
  -- `⟨`は`\<`、`⟩`は`\>`で入力できます
  IO.println (String.extract "AtCoder" ⟨5⟩ ⟨7⟩) -- er
  IO.println (String.splitOn "AtCoder Daily Training") -- [AtCoder, Daily, Training]

  -- 自然数 (`Nat`。Lean においては非負整数を指す)
  IO.println "---------- Nat    ----------"
  -- `Nat`の減算は引く数が引かれる数よりも大きいと 0 になる
  IO.println (10 - 15 + 15) -- 15
  -- 符号なし64ビット整数の範囲に収まらない数も扱える
  IO.println 1234567890_1234567890 -- 12345678901234567890
  IO.println (Nat.gcd 42 30) -- 6

  -- 整数 (`Int`)
  IO.println "---------- Int    ----------"
  -- Lean に`Int`の演算だと認識させるために`: Int`を付ける
  IO.println (10 - 15 + 15 : Int) -- 10
  -- Lean が`Int`の演算だと推論できれば`: Int`はいらない
  IO.println (7 * (-2) + 5 * 3) -- 1
  IO.println (7 / 3 * 3 + 7 % 3) -- 7

  -- 64ビット浮動小数点数 (`Float`)
  IO.println "---------- Float  ----------"
  IO.println (1.0 / 10.0) -- 0.100000
  IO.println (Float.ofNat (2 ^ 54 - 1)) -- 18014398509481984.000000

  -- 真偽値 (`Bool`)
  IO.println "---------- Bool   ----------"
  IO.println (1 == 2) -- false
  IO.println (1 != 2) -- true
  -- Nat.ble a b = a ≤ b かどうかを返す
  IO.println (Nat.ble 1 2) -- true

  -- 次のようにも書ける
  IO.println (1 = 2 : Bool) -- false
  -- `≠`は`\ne`で入力できる
  IO.println (1 ≠ 2 : Bool) -- true
  -- `≤`は`\le`で入力できる
  IO.println (1 ≤ 2 : Bool) -- true

  -- `1 ≤ 2 ∧ 2 ≤ 3`とも書ける。`∧`は`\and`で入力できる
  if Nat.ble 1 2 && Nat.ble 2 3 then
    IO.println "Yes"
  else
    IO.println "No"
  -- Yes

  -- タプル (`α × β` (`α`、`β`は型))
  IO.println "---------- Tuple  ----------"
  IO.println (1, 2) -- (1, 2)
  IO.println (Prod.fst (1, 2)) -- 1
  IO.println (Prod.snd (1, 2)) -- 2

  -- リスト (`List α` (`α`は型)、要素の列)
  -- 空でないリストは先頭の要素と、それ以降の要素からなるリストの組で表される
  IO.println "---------- List   ----------"

  -- 空のリスト。`[]`とも書ける
  IO.println (List.nil : List Nat) -- []

  -- 1, 2, 3 からなるリスト。`[1, 2, 3]`とも書ける
  IO.println (List.cons 1 (List.cons 2 (List.cons 3 List.nil))) -- [1, 2, 3]

  -- リストの k 番目の要素を取得する
  IO.println ([0, 1, 2, 3, 4][3]!) -- 3
  -- リストはランダムアクセスができない。要素の取得では先頭の要素からひとつずつ見ていくので
  -- 時間計算量が Θ(k) になる。ランダムアクセスが必要なら後述の配列を使う
```

他の型については[Basic Types | The Lean Language Reference]を参照してください。

[Basic Types | The Lean Language Reference]: <https://lean-lang.org/doc/reference/4.22.0/Basic-Types/#basic-types>

### 式の評価結果を文字列に埋め込む

`s!"...{expr}..."`で文字列に式の評価結果を埋め込めます。
JavaScript の[テンプレートリテラル]やPython の [f-string] と同じ機能です。

```lean
def main : IO Unit := do
  IO.println (s!"5! = {List.foldl Nat.mul 1 [1, 2, 3, 4, 5]}") -- 5! = 120
```

[テンプレートリテラル]: <https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Template_literals>
[f-string]: <https://peps.python.org/pep-0498/>

### ループ

自然数に対する for ループは次のように書きます。

```lean
def main : IO Unit := do
  -- 上限 r を指定する。変数は 0 から r - 1 まで動く (r は含まれない)
  for i in [:3] do
    IO.println i -- 順に 0, 1, 2 が表示される

  -- 下限 l と上限 r を指定する。変数は l から r - 1 まで動く (r は含まれない)
  for i in [1:6] do
    IO.println i -- 順に 1 から 5 までが表示される

  -- 下限 l、上限 r と増分 step を指定する
  -- `[:r]`、`[l:r]`は変数の値を 1 ずつ増やすが、`[l:r:step]`は`step`ずつ増やす
  for i in [1:14:2] do
    IO.println i -- 順に 1, 3, ..., 13 が表示される
```

`[:r]`、`[l:r]`、`[l:r:step]`は`Nat`以外の型には使えません。他の型に対しては [polymorphic range] が使えます[^4]。
しかし、AtCoder に入っている Lean のバージョン (v4.22.0)だと少し困ることがあります。

例えば、`for i in 0...<3` (`0...<3`は`[0:3]`に相当)は推論がうまくいかず、エラーが発生します。
`for i in (0 : Nat)..<3`のように型を明示するか、empty type ascription[^5] を使って`for i in (0 :)..<3`とすると
エラーが消えます。

また、`Int`に対する polymorphic range は実装されておらず (v4.24.0 で追加予定[^6])、自分で実装する必要があります。

[polymorphic range]: <https://github.com/leanprover/lean4/blob/v4.22.0/src/Init/Data/Range/Polymorphic/PRange.lean>

[^4]: polymorphic range の記法については[Data.Range.Polymorphic.PRange]と[そのテスト]が参考になります。

[Data.Range.Polymorphic.PRange]: <https://github.com/leanprover/lean4/blob/v4.22.0/src/Init/Data/Range/Polymorphic/PRange.lean>
[そのテスト]: <https://github.com/leanprover/lean4/blob/v4.22.0/tests/lean/run/rangePolymorphic.lean>

[^5]: [10.10. Type Ascription | The Lean Reference Manual]にある`(term : term)`にマウスカーソルを合わせると
  説明が見られます。

[10.10. Type Ascription | The Lean Reference Manual]: <https://lean-lang.org/doc/reference/4.22.0/Terms/Type-Ascription/>

[^6]: [feat: introduce `Int` range notation by datokrat · Pull Request #10045 · leanprover/lean4](https://github.com/leanprover/lean4/pull/10045)

リストや配列などのデータ構造の要素に対しても for ループが使えます。

```lean
def main : IO Unit := do
  -- リスト
  for i in [0, 1, 2] do
    IO.println i -- 順に 0, 1, 2 が表示される

  -- 配列
  for i in #[0, 1, 2] do
    IO.println i -- 順に 0, 1, 2 が表示される
```

for ループと同様に while ループも書けます。

```lean
def main : IO Unit := do
  let mut i := 0
  while i < 10 do
    IO.println i -- 順に 0 から 9 が表示される
    i := i + 1
```

注意として、ループが停止することを証明によって保証する必要はありません。
さらに言えば、Lean では停止しないプログラムが許されています。
これは定理証明支援系において当たり前ではありません。
例えば、Rocq では関数を定義するとき、その関数(の適用)が停止することを保証する必要があります。

{{< details summary="定理証明支援系を使ったことがある人向けの補足" >}}
(以下の説明は[7.6.5.1. Partial Functions | The Lean Language Reference](https://lean-lang.org/doc/reference/4.22.0/Definitions/Recursive-Definitions/#partial-functions)を参考にしています。)

停止しないプログラムが許されていると、矛盾を示せてしまわないかと思ってしまいますが、Lean にはそれを防ぐ制約があります。

while ループは内部では`Loop.forIn`という関数を実行しています:

<!-- markdownlint-capture -->
<!-- markdownlint-disable MD013 -->

```lean
partial def Loop.forIn {β : Type u} {m : Type u → Type v} [Monad m] (_ : Loop) (init : β) (f : Unit → β → m (ForInStep β)) : m β :=
  let rec @[specialize] loop (b : β) : m β := do
    match ← f () b with
      | ForInStep.done b  => pure b
      | ForInStep.yield b => loop b
  loop init
```

<!-- markdownlint-restore -->

(<https://github.com/leanprover/lean4/blob/v4.22.0/src/Init/While.lean#L25-L30>から引用。
閲覧日: 2025年10月8日)

この関数には`partial`が付いており、停止するとは限らない部分関数として定義されています。

部分関数は型検査後、カーネルから opaque な定数とみなされ、定義を展開することができなくなります。
そうすることで、矛盾を起こしうる関数の本体を隠し、それを使った推論をできなくしています。
(余談: もしそうしないと、例えば、`f () := !(f ())`で定義した`f : Unit → Bool`を利用して矛盾が導けます。)

加えて、部分関数の戻り値の型には値を少なくともひとつ持たないといけないという制約があります。
そうすることで、本来存在しない値を使った矛盾の導出ができないようにしています。
(余談: もし、この制約がなければ、例えば、`f : Unit → Empty`を`f () := f ()`で定義すると、
`f () : Empty`から矛盾を導けます。ただし、`Empty`はコンストラクタを持たない inductive type です。)

関数の本体、戻り値以外に推論に使えるものはないはずです。
以上から、停止しない部分関数、while ループが存在していても矛盾が導けないことが分かります。
{{< /details >}}

### 変数を定義する

変数を定義するときは`let ... := ...`を使います。

```lean
def main : IO Unit := do
  let x := 10
  let y := x^3 + 3 * x^2 + 3 * x + 1
  IO.println y -- 1331
```

`let ... := ...`で定義された変数は値を変更できません。
値を変更できる変数が欲しいときは`let mut ..:= ...`を使います[^7]。

[^7]: [Local Mutable State | The Lean Language Reference](https://lean-lang.org/doc/reference/4.22.0/Functors___-Monads-and--do--Notation/Syntax/#The-Lean-Language-Reference--Functors___-Monads-and--do--Notation--Syntax--do--Notation--Local-Mutable-State)

```lean
-- 10! を計算する
def main : IO Unit := do
  let mut fact := 1
  for i in [1:11] do
    fact := fact * i
  IO.println fact -- 3628800
```

### 配列

先述の通り、リストはランダムアクセスができません。ランダムアクセスが必要なときは配列 (`Array α`)を使います。

```lean
def main : IO Unit := do
  let a := #[0, 1, 2, 3, 4]
  IO.println a -- #[0, 1, 2, 3, 4]

  -- a の 0 番目の要素を出力する
  IO.println a[0]! -- 1

  let b := Array.replicate 5 0
  IO.println b -- #[0, 0, 0, 0, 0]

  -- b の 1 番目の要素を 1 に変更した配列を c とする
  let c := b.set! 1 1
  IO.println c -- #[0, 1, 0, 0, 0]
```

ここでは`x[i]!`と`Array.set!`を使い、添字が配列の範囲に収まっていることの証明を省略しています。
このプログラムでは範囲内にあることは明らかなので問題ありませんが、複雑なプログラムだと意図しない範囲外アクセスを
見過ごしてしまう可能性があります。

なお、上のプログラムについては Lean に証明を付けてもらうことが可能です。
出てくる配列の長さも添字も定数なので、Lean は自力で証明できます。
このようなときは代わりに`x[i]`と`Array.set`を使うと、自動で証明が付き、範囲外アクセスが起こらないことを保証できます。

`c`の定義後、`b`の値は使われません。このようなケースではプログラムの実行時に配列の再利用が行われます。
つまり、`b`が指す配列に破壊的変更が行われ、それが`c`に割り当てられます。

しかし、配列の再利用は常に行なわれるわけではありません。例えば、次のプログラムでは`b`が指す配列の再利用は行われず、
コピーが行われます[^8]。

```lean
def main : IO Unit := do
  -- n を標準入力から受け取ることで b の値が実行時に決まるようにする
  let stdin ← IO.getStdin
  let n ← stdin.getLine.map (·.trim.toNat!)

  let b := Array.replicate n 0
  IO.println b

  let c := b.set! 1 1
  IO.println c

  -- c の定義後に b を使う
  IO.println b
```

`Array.set!`のような配列に変更を施す関数が実行時に再利用を行うかは配列の参照カウンタが 1 かどうかで決まるようです[^9]。

配列は`let mut`と組み合わせて使うと便利です。

```lean
def main : IO Unit := do
  let mut x := #[3, 1, 4, 1, 5]
  for i in [0:4] do
    x := x.set! (i + 1) (x[i + 1]! + x[i]!)
  IO.println x -- #[3, 4, 8, 9, 14]
```

[^8]: コピーが行われたかはどうかは`dbgTraceIfShared`を使って確認できます。
    詳しくは[21.2.1. Observing Uniqueness | The Lean Language Reference]を参照してください。

[21.2.1. Observing Uniqueness | The Lean Language Reference]: <https://lean-lang.org/doc/reference/4.22.0/Run-Time-Code/Reference-Counting/#The-Lean-Language-Reference--Run-Time-Code--Reference-Counting--Observing-Uniqueness>

[^9]: [19.16. Arrays | The Lean Language Reference]には次のように書かれています:

    <!-- markdownlint-capture -->
    <!-- markdownlint-disable MD013 -->
    > Even more importantly, if there is only a single reference to an array, operations that might otherwise copy or allocate a data structure can be implemented via mutation. Lean code that uses an array in such a way that there's only ever one unique reference (that is, uses it linearly) avoids the performance overhead of persistent data structures while still being as convenient to write, read, and prove things about as ordinary pure functional programs.
    <!-- markdownlint-restore -->
    (閲覧日: 2025年10月8日)

    また、`Array.set!`のドキュメントには以下の記述があります:

    <!-- markdownlint-capture -->
    <!-- markdownlint-disable MD013 -->
    > This will perform the update destructively provided that a has a reference count of 1 when called.
    <!-- markdownlint-restore -->
    ([Array.set! | The Lean Language Reference]から引用。閲覧日: 2025年10月8日)

[19.16. Arrays | The Lean Language Reference]: <https://lean-lang.org/doc/reference/4.22.0/Basic-Types/Arrays/>
[Array.set! | The Lean Language Reference]: <https://lean-lang.org/doc/reference/4.22.0/Basic-Types/Arrays/#Array___set___>

<!-- markdownlint-capture -->
<!-- markdownlint-disable MD013 -->

<!-- 実際、この仕様は実装から次のようにして確認できます。 -->

<!-- - [Array.set!][Array.set!]: 実行時は`lean_array_set`を呼び出す
- [lean_array_set][lean_array_set]: `lean_array_uset`を呼び出す
- [lean_array_uset][lean_array_uset]: `lean_ensure_exclusive_array`を呼び出す
- [lean_ensure_exclusive_array][lean_ensure_exclusive_array]: 参照の数に応じて再利用するかコピーするかを決めている     -->

<!-- [Array.set!]: <https://github.com/leanprover/lean4/blob/v4.22.0/src/Init/Data/Array/Set.lean#L54-L56>
[lean_array_set]: <https://github.com/leanprover/lean4/blob/v4.22.0/stage0/src/include/lean/lean.h#L863-L870>
[lean_array_uset]: <https://github.com/leanprover/lean4/blob/v4.22.0/stage0/src/include/lean/lean.h#L849-L855>
[lean_ensure_exclusive_array]: <https://github.com/leanprover/lean4/blob/v4.22.0/stage0/src/include/lean/lean.    h#L844-L847> -->

<!-- markdownlint-restore -->

### 関数を定義する

すでに`main`関数が出ていますが、関数は次のように定義します。

```lean
-- Nat 型の値 x, y を受け取り、Nat 型の値を返す関数
-- パラメータ部分はまとめて`(x y : Nat)`とも書ける
def pairing (x : Nat) (y : Nat) : Nat :=
  (x + y) * (x + y + 1) / 2 + y
```

パラメータ、戻り値の型は Lean が推論可能ならば省略できます。

匿名関数は`fun ... => ...`で書けます。

```lean
def main := do
  let pairing := fun x y => (x + y) * (x + y + 1) / 2 + y
  IO.println (pairing 3 3) -- 24
```

### 関数に関する便利な記法

関数に関して便利な記法がいくつかあります。

- `f $ e`: `f (e)`と等価です。`e`の周りに括弧を付けなくて済みます。
  `f $ g $ e`のように続けて書けます(`f (g (e))`と等価)。Haskell にもありますね。
- `e |> f`: `f (e)`と等価です。`e |> f |> g`のように続けて書けます(`g (f (e))`と等価)。
  適用する関数が見やすくなることに加えて、関数が適用される順番が記述した順番と同じになるので、
  可読性を上げられます。OCaml にもありますね。
- `f ∘ g`: 合成関数`fun x => f (g x)`と等価です。Haskell だと`.`ですね。
- `(f · y ·)`: `fun x z => f x y z`と等価です。つまり、それぞれの`·`を別々のパラメータに変えた関数になります。

  `·`は`\.`で入力できます。また、括弧は必須です。

  括弧の中身は自由です。`(· + ·)` (`fun x y => x + y`と等価)なども書けます。

  この記法は括弧が閉じられるたびに関数を作成するので括弧をネストすると意図しない関数が生成されてしまうことがあります。
  例えば、`(· * (· + z))`は`fun x => x * (fun y => y + z)`になります。
  (`fun x y => x * (y + z)`にはなりません。)

  詳しくは[Sugar for Simple Functions | Theorem Proving in Lean4]を参照してください。
- `"ABC ARC AGC".splitOn`: `String.splitOn "ABC ARC AGC"`と等価です。
  まるでメソッド呼び出しであるかのように書けます。
  この記法が使える条件については[10.4.1. Generalized Field Notation | The Lean Language Reference]を参照してください。
  また、[ABC087B](#abc087b)ではこの記法が使えるように関数を定義する方法を説明しています。

[Sugar for Simple Functions | Theorem Proving in Lean4]: <https://lean-lang.org/theorem_proving_in_lean4/Interacting-with-Lean/#sugar-for-simple-functions>
[10.4.1. Generalized Field Notation | The Lean Language Reference]: <https://lean-lang.org/doc/reference/4.22.0/Terms/Function-Application/#generalized-field-notation>

### 標準入力から読み込む

#### 1行読む

```lean
def main : IO Unit := do
  let stdin ← IO.getStdin
  -- `line`の末尾には改行が入る
  let line ← stdin.getLine
  IO.print line
```

`let ...`の後が`:=`ではなく`←` (`\l`で入力できる)であることに注意してください。
これはモナド値から値を取り出して、変数をその値に束縛させる記法です(よく分からなければスルーして大丈夫です)。
Haskell で言うと`x <- m`です。

`line`の末尾には改行が入ります。改行を取り除いた文字列は`line.stripSuffix "\n"`で得られます。
もし、末尾に空白文字(` `、`\t`、`\r`、`\n`)が複数あるときは`line.trimRight`で取り除けます。
先頭からも取り除きたければ`line.trim`を使います。

#### 自然数を1つ読む

```lean
def main : IO Unit := do
  let stdin ← IO.getStdin
  let n ← stdin.getLine.map (·.trim.toNat!)
  IO.println n
```

`String.toNat!`は与えられた文字列を自然数に変換できないときに panic を発生させます[^10]。

AtCoder では不正な入力が与えられることはまずないので`String.toNat!`で十分ですが、
普通のプログラミングでは戻り値が`Option`型である`String.toNat?`を使った方がいいでしょう。

整数を読むときは`String.toInt!`が使えます。しかし、64ビット浮動小数点数に対しては標準ライブラリにそのような関数は
ないようです。
[#Is there code for X? > float('3.3') in Lean 4? - Lean - Zulip]では代わりに`Lean.JSON.parse`を使う方法が
紹介されています(自分は使ったことがありません)。

`map`は Haskell で言うところの`fmap`だと思って差し支えなさそうです。

[^10]: と[ドキュメント][String.toNat!]に書かれていて、このプログラムではちゃんと panic が発生するのですが、
    自分の環境 (Lean v4.22.0)だと以下のプログラムで panic が発生しませんでした。

    ```lean
    def main : IO Unit :=
      IO.println "#".toNat!
    ```

    プログラムの最適化が影響していそうですが、よく分かっていません。

[String.toNat!]: <https://lean-lang.org/doc/reference/4.22.0/Basic-Types/Strings/#String___toNat___-next>

[#Is there code for X? > float('3.3') in Lean 4? - Lean - Zulip]: <https://leanprover.zulipchat.com/#narrow/channel/217875-Is-there-code-for-X.3F/topic/float.28'3.2E3'.29.20in.20Lean.204.3F>

#### 自然数を任意個読む

```lean
def main : IO Unit := do
  let stdin ← IO.getStdin
  let ns ← stdin.getLine.map (·.trim.splitOn.map (·.toNat!))
  for n in ns do
    IO.println n
```

このプログラムでは`ns`はリストになります。配列が欲しい場合は`List.toArray`を使います。

```lean
def main : IO Unit := do
  let stdin ← IO.getStdin
  let ns ← stdin.getLine.map (· |> (·.trim.splitOn.map (·.toNat!)) |> (·.toArray))
  for n in ns do
    IO.println n
```

`map`の後の関数は`e |>. f` (`(e).f`と等価だが括弧が付かない)[^11]を使うともっと綺麗に書けます。

```lean
def main : IO Unit := do
  let stdin ← IO.getStdin
  let ns ← stdin.getLine.map (·.trim.splitOn.map (·.toNat!) |>.toArray)
  for n in ns do
    IO.println n
```

[^11]: [10.4.2. Pipeline Syntax | The Lean Language Reference](https://lean-lang.org/doc/reference/4.22.0/Terms/Function-Application/#The-Lean-Language-Reference--Terms--Function-Application--Pipeline-Syntax)

#### 自然数を決まった個数読む

例えば、自然数を2つ読みたいときは次のように書けます。

```lean
def main : IO Unit := do
  let stdin ← IO.getStdin
  let [a, b] ← stdin.getLine.map (·.trim.splitOn.map (·.toNat!))
    | unreachable!
  IO.println s!"{a} {b}"
```

`| unreachable!`は個数が合わないときの処理で、panic を発生させます[^12]。

[^12]: 構文の説明は[14.3. Syntax | The Lean Language Reference](https://lean-lang.org/doc/reference/4.22.0/Functors___-Monads-and--do--Notation/Syntax/#Lean___Parser___Term___doSeqItem-next-next-next-next)にあります。

## 問題を解く

[Language Test 202505](https://atcoder.jp/contests/language-test-202505)の問題を解きました。

コンテストの問題は過去に出題された問題なので問題自体の説明はしません。

### PracticeA

```lean
def main : IO Unit := do
  let stdin ← IO.getStdin
  let a ← stdin.getLine.map (·.trim.toNat!)
  let [b, c] ← stdin.getLine.map (·.trim.splitOn.map (·.toNat!))
    | unreachable!
  let s ← stdin.getLine.map String.trim
  IO.println s!"{a + b + c} {s}"
```

### ABC086A

```lean
def main : IO Unit := do
  let stdin ← IO.getStdin
  let [a, b] ← stdin.getLine.map (·.trim.splitOn.map (·.toNat!))
    | unreachable!
  if a * b % 2 == 0 then
    IO.println "Even"
  else
    IO.println "Odd"
```

`Nat`には上限がないのでオーバーフローを気にする必要はありません。

### ABC081A

Batteries というライブラリに`String.count`という関数があります[^13]。
Batteries は Mathlib をインストールすると一緒にインストールされます。

標準ライブラリだけで書きたければ、`String.toList`で文字列をリストに変換して、`List.count`を使えばいいです。

これらの関数は Loogle で見つけました。例えば、`String, "count"`で検索すると`String.count`が出てきます。

```lean
import Batteries.Data.String.Basic

def main : IO Unit := do
  let stdin ← IO.getStdin
  let s ← stdin.getLine
  IO.println $ s.count '1'
```

[^13]: [Batteries.Data.String.Basic](https://leanprover-community.github.io/mathlib4_docs/Batteries/Data/String/Basic.html#String.count)

### ABC081B

Mathlib に`Nat.maxPowDiv`というぴったりの関数があります[^14]。

入力の整数をリストで持ち、`List.map` (リストの各要素に関数を適用したリストを返す)、
`List.foldl` (リストの畳み込み (folding)を行う[^15])を使うことで短く書けます。

```lean
import Mathlib.Data.Nat.MaxPowDiv

def main : IO Unit := do
  let stdin ← IO.getStdin
  let _ ← stdin.getLine
  let a ← stdin.getLine.map (·.trim.splitOn.map (·.toNat!))
  let res :=
    a
    |>.map (Nat.maxPowDiv 2)
    |>.foldl Nat.min 100
  IO.println res
```

[^14]: [Mathlib.Data.Nat.MaxPowDiv](https://leanprover-community.github.io/mathlib4_docs/Mathlib/Data/Nat/MaxPowDiv.html#Nat.maxPowDiv)
[^15]: 競技プログラミングでお馴染みの数列の畳み込みとは異なるので注意してください。

### ABC087B

標準入力から数を4回受け取る必要があるので、その部分を関数にしました。
`stdin.getNat!`と書けるようにするために`getNat!`を`stdin`の型と同名の名前空間`IO.FS.Stream`で定義しています。

```lean
namespace IO.FS.Stream
  /--
    Reads a natural in a line.
    Panics if the line cannot be parsed as a single natural.
  -/
  def getNat! (self : IO.FS.Stream) : IO Nat :=
    self.getLine.map (·.trim.toNat!)
end IO.FS.Stream

def main : IO Unit := do
  let stdin ← IO.getStdin
  let a ← stdin.getNat!
  let b ← stdin.getNat!
  let c ← stdin.getNat!
  let x ← stdin.getNat!
  let mut res := 0
  for i in [0:a+1] do
    for j in [0:b+1] do
      for k in [0:c+1] do
        if 500 * i + 100 * j + 50 * k == x then
          res := res + 1
  IO.println res
```
