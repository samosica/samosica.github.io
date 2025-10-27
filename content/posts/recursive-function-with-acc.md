---
title: "Accを使って定義した再帰関数の評価が進まないのはなぜか調べる (Rocq)"
date: 2025-10-28T00:00:00+09:00
lastmod: 2025-10-28T00:00:00+09:00
draft: false
math: false
toc: false
description: ""
---

Accを使って定義した再帰関数の評価が進まず、自明な定理が直ちに示せなかったのでその原因を調べました。

<!--more-->

以下の関数`floor_log2`を考えます[^1]。

[^1]: 定義の方法は[Xavier Leroy, "Well-founded recursion done right"]を参考にしています。
この資料では整礎関係に基づく再帰関数を定義するとてもシンプルな方法が紹介されています。

[Xavier Leroy, "Well-founded recursion done right"]: <https://popl24.sigplan.org/details/CoqPL-2024-papers/2/Well-founded-recursion-done-right>

```coq
From mathcomp Require Import ssreflect.
From Stdlib Require Import Arith Lia ZifyNat.

Lemma floor_log2_proof {n} : 1 < n -> n / 2 < n.
Proof. by lia. Defined.

Fixpoint floor_log2 n (ACC : Acc lt n) :=
  match le_lt_dec n 1 with
  | left _ => 0
  | right H => S (floor_log2 (n / 2) (Acc_inv ACC (floor_log2_proof H)))
  end.
```

このとき、以下の一見自明に見える定理は`by []`や`reflexivity`だけでは証明できません。

```coq
Theorem floor_log2E n (ACC : Acc lt n) :
  floor_log2 n ACC =
    match le_lt_dec n 1 with
    | left _ => 0
    | right H => S (floor_log2 (n / 2) (Acc_inv ACC (floor_log2_proof H)))
    end.
Proof.
Fail by [].
Admitted.
```

`ACC`を分解すると証明ができます。

```coq
Theorem floor_log2E_retry n (ACC : Acc lt n) :
  floor_log2 n ACC =
    match le_lt_dec n 1 with
    | left _ => 0
    | right H => S (floor_log2 (n / 2) (Acc_inv ACC (floor_log2_proof H)))
    end.
Proof.
case: ACC => ?.
by [].
Qed.
```

なぜ分解すると証明がうまくいくのか調べたところ、Rocq の reference manual で以下の記述を見つけました。

<!-- markdownlint-capture -->
<!-- markdownlint-disable MD013 -->
>In order to keep the strong normalization property, the fixed point reduction will only be performed when the argument in position of the decreasing argument (which type should be in an inductive definition) starts with a constructor.
<!-- markdownlint-restore -->

([Inductive types and recursive functions — The Rocq Prover 9.1.0 documentation]から引用。
閲覧日: 2025年10月27日)

[Inductive types and recursive functions — The Rocq Prover 9.1.0 documentation]: <https://rocq-prover.org/doc/v9.1/refman/language/core/inductive.html#:~:text=In%20order%20to%20keep%20the%20strong%20normalization%20property%2C%20the%20fixed%20point%20reduction%20will%20only%20be%20performed%20when%20the%20argument%20in%20position%20of%20the%20decreasing%20argument%20(which%20type%20should%20be%20in%20an%20inductive%20definition)%20starts%20with%20a%20constructor.>

この記述によると、再帰関数の適用は decreasing argument (関数の停止性を保証する呼び出しのたびに小さくなる引数)が
コンストラクタでないと評価が進まないそうです。

同様の記述が<https://rocq-prover.org/doc/v9.1/refman/language/core/inductive.html#reduction-rule>でも確認できます。

`floor_log2`の decreasing argument は`ACC`です。なので、`ACC`を分解してコンストラクタの形で表さないと
評価が進まないということのようです。

分かってしまえば何と言うことはないのですが、こういう挙動に関する記述を探すのは意外と苦労するのでメモしておきます。
