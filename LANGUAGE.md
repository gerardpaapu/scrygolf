# Scrygolf Language Reference

Scrygolf is a compact, stack-based query language that compiles to [Scryfall](https://scryfall.com/docs/syntax) search syntax. It uses emoji as vocabulary tokens to keep queries short.

## How the stack works

Tokens are processed left-to-right. Most emoji and text tokens **push** a value onto the stack. Operators **consume** values from the stack and push a transformed result. At the end, everything remaining on the stack is joined with spaces (logical AND) to form the final query.

---

## Token types

### Plain text

Any non-emoji, non-operator string (delimited by whitespace) is pushed as a literal value.

```
goblin       →  goblin
lightning    →  lightning
```

### Date ranges

Date ranges use two-digit years. Years below 90 are treated as 2000s; 90 and above as 1900s.

| Pattern | Meaning | Example | Output |
|---------|---------|---------|--------|
| `NN-MM` | Between two years | `97-04` | `(year>=1997 year<=2004)` |
| `NN-`   | From a year onwards | `13-` | `year>=2013` |
| `-NN`   | Up to a year | `-13` | `year<=2013` |

```
06-          →  year>=2006
-99          →  year<=1999
93-99        →  (year>=1993 year<=1999)
89-          →  year>=1989
90-          →  year>=1990
```

### Color emoji

These push a `color:` filter onto the stack.

| Emoji | Output |
|-------|--------|
| ⚪ | `color:white` |
| 🔵 | `color:blue` |
| ⚫ | `color:black` |
| 🔴 | `color:red` |
| 🟢 | `color:green` |

```
🔵           →  color:blue
⚪🔴         →  color:white color:red
```

### Creature type emoji

These push a `type:` filter. A sample of the available emoji:

| Emoji | Output | Emoji | Output |
|-------|--------|-------|--------|
| 👺 | `type:goblin` | 🐲 | `type:dragon` |
| 🐻 | `type:bear` | 🧛 | `type:vampire` |
| 🐺 | `type:wolf` | 🧟 | `type:zombie` |
| 🧝 | `type:elf` | 🕷️ | `type:spider` |
| 👼 | `type:angel` | 🐦‍🔥 | `type:phoenix` |
| 🐍 | `type:snake` | 🦈 | `type:shark` |
| 🐸 | `type:frog` | 🐙 | `type:octopus` |
| 🤖 | `type:robot` | 🤡 | `type:clown` |
| 🏴‍☠️ | `type:pirate` | 🦄 | `type:unicorn` |

```
👺           →  type:goblin
🐲           →  type:dragon
👺🐲         →  type:goblin type:dragon
```

### Oracle-word emoji

Some emoji map to plain words that appear in oracle text, card titles, or type lines. These push the bare word (no prefix). There is a large vocabulary — a few examples:

| Emoji | Word | Emoji | Word |
|-------|------|-------|------|
| 💀 | `skull` | 🧠 | `brain` |
| 👻 | `ghost` | 💥 | `collision` |
| 🔥 | `fire` | 💨 | `dashing` |
| 🧙 | `mage` | 💂 | `guard` |

```
💀           →  skull
👻           →  ghost
```

If an emoji is not in any vocabulary it is silently ignored (no output is pushed for it). This is intentional — the emoji vocabularies are curated subsets.

---

## Operators

### `!` — negate

Wraps the top stack value in `-(...)`.

```
🐻!          →  -(type:bear)
color:blue!  →  -(color:blue)
```

Empty stack: no-op.

---

### `.` — conjoin (logical AND)

Takes all values off the stack, reverses them (so left-to-right push order is preserved), joins with a space, and wraps in `(...)`.

```
🐻🐺.        →  (type:bear type:wolf)
⚪🔵🟢.      →  (color:white color:blue color:green)
```

Empty stack: no-op.

---

### `|` — disjoin (logical OR)

Like conjoin but joins with ` OR `.

```
🐻🐺|        →  (type:bear OR type:wolf)
⚪🔵|        →  (color:white OR color:blue)
```

Empty stack: no-op.

---

### `👎` or `^` — conjoin-negations

Takes all values off the stack, joins with ` OR `, and wraps in `-(...)`. Equivalent to disjoin followed by negate, but in one token.

```
🐻🐺👎       →  -(type:bear OR type:wolf)
⚪🟢👎       →  -(color:white OR color:green)
```

Empty stack: no-op.

---

### `🖼️` — art tag

Pops the top stack value, **unwraps** it (see below), and emits `art:<word>`.

```
🐻🖼️         →  art:bear
🟢🖼️         →  art:green
```

Empty stack: pushes the bare string `art` (which can be combined further).

---

### `👨‍🎨` — artist

Pops and unwraps the top value, emits `artist:<word>`.

```
🐻👨‍🎨        →  artist:bear
```

Empty stack: pushes the bare string `artist`.

---

### `🔮` — oracle text

Pops and unwraps the top value, emits `fo:<word>`.

```
🐻🔮         →  fo:bear
💀🔮         →  fo:skull
```

Empty stack: pushes the bare string `oracle`.

---

## Unwrapping

The art, artist, and oracle-text operators need a plain word, but emoji often produce prefixed values like `type:bear` or `color:green`. **Unwrapping** strips known prefixes:

| Stack value | Unwrapped to |
|-------------|--------------|
| `type:bear` | `bear` |
| `color:green` | `green` |
| `fo:bear` | `"oracle bear"` (quoted phrase) |
| anything else with `:` | `"prefix value"` (quoted phrase) |
| plain word | unchanged |

This means you can use creature or color emoji directly with art/artist/oracle operators:

```
🐻🖼️         →  art:bear         (type:bear unwrapped to bear)
🟢🖼️         →  art:green        (color:green unwrapped to green)
🐻🔮🖼️       →  art:"oracle bear" (fo:bear unwrapped to "oracle bear")
🐻🖼️🖼️       →  art:"art bear"   (art:bear unwrapped to "art bear")
```

---

## Combining operators

Because operators consume the whole stack or just the top item, you can build complex queries by ordering tokens carefully.

**All wolves or bears, excluding either color:**
```
🟢⚪👎🐻🐺|   → -(color:green OR color:white) (type:bear OR type:wolf) 
```

**Green or white wolves printed before 2010:**
```
🟢⚪|🐺-10    →  (color:green OR color:white) type:wolf year<=2010
```

**Bear art by any artist, from 2006 onwards:**
```
🐻🖼️06-       →  art:bear year>=2006
```

**Cards that aren't green or white:**
```
🟢⚪👎         →  -(color:green OR color:white)
```

**Non-goblin, non-zombie cards**
```
👺🧟👎         →  -(type:goblin OR type:zombie)
```

**Dragons printed between 1993 and 1999:**
```
🐲93-99        →  type:dragon (year>=1993 year<=1999)
```
