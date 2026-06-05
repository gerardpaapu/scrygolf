# scrygolf

Scrygolf is a code golf style alternative syntax for querying scryfall.

It's stack oriented, and uses emojis to have a wide vocabulary, but mostly for whimsy.

Being a stack language helps us avoid extra tokens for parentheticals, which can be avoided simply by ordering tokens correctly.

Operators can either transform the top-N items on the stack, e.g. `negate` takes the top item and wraps it in `-( )`, where as `conjoin` takes all values of the stack and joins then with `' '` (logical AND) while `disjoin` takes all the values off the stack and joins them with `' OR '`.

## tokens

each emoji grapheme is an individual token and so are specific characters like '.' and '!' other plain strings are tokens separated by any amount of whitespace.

## emoji

we have a pre-built vocabulary of emoji that are mapped to words that appear in card titles, type lines and oracle text. This avoids accessing large data sets at runtime.

A subset of those words that are creature types are automatically converted to `(type:${name})` so that the goblin emoji can be used to search for cards with the 

A smaller subset of those words map to color names and automatically converted to `(color:${name})`.

## unwrapping

Some operators want to take plain-words off the stack, e.g. `art` or 🖼️ wants to take a plain word off the stack and emit `(art:${word})`, but many of our emoji will be automatically mapped to creature types or some other type of query. 

We introduce the idea of unwrapping a stack item like `(type:bear)` to recover the original word `bear`.