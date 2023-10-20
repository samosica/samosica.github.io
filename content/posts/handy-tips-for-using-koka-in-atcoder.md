---
title: "AtCoderでKokaを使うときのTips"
date: 2023-08-12T20:19:00+09:00
draft: false
math: true
---

2023年8月に行なわれた言語アップデートにより AtCoder で [Koka](https://koka-lang.github.io/koka/doc/book.html) が使えるようになりました。
この記事では Koka を使って問題を解くときに役に立ちそうな情報を書いていきます。

<!--more-->

### 注意

最初に筆者は Koka にそこまで詳しくなく、[公式ドキュメント](https://koka-lang.github.io/koka/doc/book.html)も通読していません。Koka が AtCoder に入ってから少しだけ真面目に書くようになりました。なので、記述に誤りがあるかもしれません。

次に本記事で使っている Koka コンパイラのバージョンは AtCoder にインストールされている v2.4.0 です。Koka は開発途中のプログラミング言語であり、バージョンを重ねていくと、ここに書かれているプログラムのコンパイルが通らなくなる可能性があります。

また、Koka コンパイラは JavaScript バックエンドや WASM バックエンドを持ちますが、ここでは AtCoder と同じく C バックエンドを使う (一旦 C 言語に変換してからバイナリファイルを生成する) ことを想定しています[^1]。

[^1]: 余談ですが、AtCoder では C 言語からのコンパイルには gcc を使用しているようです。

最後に本記事では Koka 自体の説明はしません。ご興味のある方は[公式ドキュメント](https://koka-lang.github.io/koka/doc/book.html)をご覧ください。

### parseは速くない

`std/text/parse`が提供しているパーサーコンビネーターはあまり速くありません。
空白区切りの値を読み込むときは`split`で分割して、分割された文字列を適切な型に変換した方が速いです。

例えば、新ジャッジテストコンテスト -Algorithm-で出題された [Add One Edge](https://atcoder.jp/contests/newjudge-2308-algorithm/tasks/abc309_d) において、パーサーコンビネーターを用いた実装は TLE しましたが、`split` を用いた実装 (入力を受け取る部分以外は同じ実装) は TLE せず、十分早い時間で AC しました。

- パーサーコンビネーターを用いた実装: 2183 ms で TLE (<https://atcoder.jp/contests/newjudge-2308-algorithm/submissions/44338567>)
- `split`、`parse-int`を用いた実装: 189 ms で AC (<https://atcoder.jp/contests/newjudge-2308-algorithm/submissions/44346224>)

入力を受け取る処理は何度も書くことになるので、次のような関数を用意しておくと良さそうです。

```koka
fun read-ints(): <console,exn> list<int>
    readline().split(" ").map(fn(s) { s.parse-int.unjust })
```

### readline関数は最大 1022 文字しか読まない

`std/os/readline`の`readline`関数は必ずしも1行分の文字列を読み取るとは限りません。
このことは標準ライブラリのドキュメントに記載があります ([引用元](https://koka-lang.github.io/koka/doc/std_os_readline.html), 2023年8月16日に確認)。

> Read chararacters until either a newline is encountered (not included in the result), or 1023 characters have been read.

改行文字を読んでいなくても一定文字数を読んでいたらそれまでの文字列を返します。なお、上の文章では 1023 文字までと書かれていますが、正確には 1022 文字です[^2]。

[^2]: [実装](https://github.com/koka-lang/koka/blob/v2.4.0/kklib/src/os.c#L247-L258)を読んでみると、`fgets(buf, 1023, stdin)`を呼び出していることが分かります。`fgets`は第2引数から1だけ引いた数の文字を読み込むので、1023 - 1 = 1022 文字まで読み込むことになります。

この仕様は1行に長い文字列や大量の整数が書かれているときに問題になります。
例えば、Language Test 202301 で出題された [Shift only](https://atcoder.jp/contests/language-test-202301/tasks/abc081_b) を解くときに困ります。
そのようなときは`std/os/file`の`read-text-file`関数を使って一度入力全体を読み込むとよいです。実装例は[こちらの提出](https://atcoder.jp/contests/language-test-202301/submissions/44598654)をご覧ください。

### println は flush をしない

インタラクティブ形式の問題では出力の度に flush することが要求されますが、`println`関数は flush を行ないません。
そのため、手動で flush する必要があります。flush する関数は C 言語を埋め込む`c inline ...`を使って次のように書けます。

```koka
// 注意: fun ではなく extern
extern flush() : console ()
    c inline "(fflush(stdout))"
```

Koka だけでは厳しそうで、C 言語を埋め込まないと無理そうなことは時々あるので、`extern`と`c inline`は頭の片隅に置いておきたいです。

### `ref<vector<a>>` が指す vector の更新には modify を使う

参照 (`ref<a>`) の指す vector は`modify`関数 ([リンク](https://koka-lang.github.io/koka/doc/std_core_types.html#modify)) を使って、次のように更新します。

```koka
// r : ref<vector<a>>
r.modify fn(v)
    // v は r が指す vector
    // v の i 番目の要素を x に変更する
    v[i] := x
```

試していませんが、`ref<vector<ref<vector>>>`のような多次元の可変 vector の変更も`modify`を入れ子にすればできそうです。

### 関数とその内部にある関数の両方で var を使っていると面倒なことが起きる

**注記: ここの内容を正確に書くにはコンパイルの挙動を詳しくなる必要があるのですが、時間を割く余力がないので怪しいメンタルモデルを提示するのに留めています。**

例を出すと、次のコードはコンパイルが通りません。

```koka
fun say-kuku()
    // say-kuku のスコープと while の第2引数に指定した関数のスコープで var を使用している
    var i := 1
    // 関数であることを強調するために省略記法を用いていない
    while({ i <= 9 }, fn() {
        var j := 1
        while { j <= 9 }
            if j > 1 then " ".print
            (i * j).show.pad-left(2, ' ').print
            j := j + 1
        i := i + 1
        "".println
    })
```

このコードのコンパイルが通らない原因を自分は以下のような感じで理解しています (**注意: 間違っています**)。

1. ローカル変数を宣言したスコープごとにハンドラが挿入される (**注意: プログラムの中間表現[^3]を見ると分かりますが、実際には挿入されてはいなさそうです**)。上のコードだと次のようなコードに変換される。

    [^3]: `koka`コマンドに`--core`オプションを付けると`.koka`ディレクトリ内に core file (拡張子は`.kkc`) が生成されます。また、`--showcore`オプションを付けると標準出力にその内容が表示されます。

    ```koka
    // 注意: このコードは正確ではありません
    fun say-kuku()
        // ハンドラを挿入
        with handle-local-variables-in-say-kuku
        var i := 1
        while({ i <= 9 }, fn() {
            // ハンドラを挿入
            with handle-local-variable-in-annonymous-function-2
            var j := 1
            while { j <= 9 }
                if j > 1 then " ".print
                (i * j).show.pad-left(2, ' ').print
                j := j + 1
            i := i + 1
            "".println
        })
    ```

2. 内側のスコープで`i`にアクセスしたとき、外側のハンドラを使わなければならないが、内側のハンドラが使われてしまう。これがコンパイルエラーを生じさせる。

このメンタルモデルを**信じる**ことにすると、`i`へアクセスするときにエフェクトのマスキング (詳しくは公式ドキュメントの[Masking Effects](https://koka-lang.github.io/koka/doc/book.html#sec-mask)をご覧ください) をすればコンパイルが通りそうです。実際、次のコードはコンパイルが通り、正常に動作します。

```koka
fun say-kuku'()
    var i := 1
    while({ i <= 9 }, fn() {
        var j := 1
        val i' = mask<local>{ i }
        while { j <= 9 }
            if j > 1 then " ".print
            (i' * j).show.pad-left(2, ' ').print
            j := j + 1
        mask<local>{ i := i + 1 }
        "".println
    })
```

他の解決策に`j`も`say-kuku'`のスコープに持ってくるというのがあります (昔の C 言語みたい)。

### `ref<a>` を要素に持つ vector を作りたいときは vector(n, ref(init)) した後に for 文で再代入する

まず、参照を要素に持つ vector は`vector-init`関数では作れません。なぜかというと、`vector-init`の第2引数として指定する位置ごとの初期値を計算する関数はエフェクトを発生させてはいけませんが、参照を作成すると`alloc<h>`というエフェクトが生じてしまうからです。

そのため、`vector-init`関数ではなく`vector`関数を使う必要があります。
しかし、`vector(n, ref(init))`だけだとすべての参照が同じ reference cell を指してしまいます (Python で`[[]] * 10`、OCaml で`Array.make 10 [| |]`と書いたときに起こる問題と同じです)。なので、後で再代入しなければいけません。

```koka
val v = vector(10, ref(0))
// この行の時点では v[i] はすべて同じ reference cell を指す
for (0, v.length - 1) fn(i)
    v[i] := ref(0)
// この行の時点で各 v[i] は相異なる reference cell を指す
```

### 同じ名前の関数を区別して呼び出す

Koka は関数のオーバーロードが可能です。そのために関数名から型が一意に定まらず、時折型推論がうまくいかないことがあります。

そのようなときは`(show: (bool) -> string)(x)`のように型注釈を加えたり、`std/num/int64/and`のように関数名の前にその関数が属するモジュールの名前を書いたりするといいです。

### string は `vector<char>` に変換して使う

`string`型には指定した位置の文字を返す関数がありません。
文字列の一部を表す型である`sslice`の関数を使うとそのような関数が書けますが、 $i$文字目のアクセスが$\Theta(i)$になってしまいます。
そのため、素直に`vector<char>`に変換して扱うのが良さそうです。`string`から`vector<char>`への変換には`vector`関数、逆変換には`string`関数を使います。

### early return

Koka では関数から値を返すときに`return`を使うと early return ができます。
これを使うと、例えば、二分探索が次のように書けます。

```koka
fun binsearch(ok: int, ng: int, p: (int) -> e bool): e int
    if abs(ok - ng) <= 1 then return ok
    val m = (ok + ng) / 2
    if p(m) then binsearch(m, ng, p)
    else binsearch(ok, m, p)
```

なお、Koka では`return`を書かなくても最後に評価された式の値が戻り値になりますが、その場合は early return は行なわれません。
例えば、次のように`count-down`を定義したうえで`count-down(10)`を実行すると`-1`以降も出力されて、停止しません。

```koka
fun count-down(n: int): console ()
    if n < 0 then ()
    n.println
    // -1 で止まってくれるはずなので unsafe-decreasing を付けて div を取り除く
    count-down(unsafe-decreasing(n.dec))
```

### fold-int のドキュメントでの記述と実際の挙動が異なる

`fold-int`関数はドキュメントで次のように説明されています ([引用元](https://koka-lang.github.io/koka/doc/std_core.html#fold_int))。

> fold over the integers between [start,end] (inclusive).

しかし、以下の式を評価すると`1`から`9`までが表示され、`10`は表示されないことからも分かるように、実際には`[start, end)` (= `[start, end - 1]`)内の整数を畳み込んでいます。

```koka
fold-int(1, 10, 0, fn(i, acc) { i.println; acc + i })
```

### 関数のパラメータにはパターンを指定できる

関数のパラメータとしてパターンを指定すると、そこでパターンマッチングを行なえます。
次の例ではパラメータ部分にタプルのパターンを指定しています。

```koka
fold-int(1, 10, (0, 1), fn((s, p), i) { (s + i, p * i) })
```
