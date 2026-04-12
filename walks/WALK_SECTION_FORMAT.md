# Walk Section File Format Reference

This document describes the expected format for walk section files in this site. Use it as a reference when adding new sections or fixing sections that were entered in the wrong format.

## File structure

Each circular walk section is split into **two files**: one for the outward leg and one for the return leg.

### Filenames

```
section-{N}-(out).md
section-{N}-(return).md
```

For example: `section-14-(out).md` and `section-14-(return).md`.

### Frontmatter

Each file has YAML frontmatter with this schema:

```yaml
---
slug: section-{N}-(out)           # Must match the filename (without .md)
title: Section {N} (Out)          # "Section {N} (Out)" or "Section {N} (Return)"
subtitle: Place A to Place B      # For return files, the places are reversed
details:
  Map: 'Explorer 150 Canterbury & the Isle of Thanet'
  'Total Circular Distance': '4 miles/3 hours'
  Start: 'Description of where to start and park.'
  Comment: 'Description of the walk character and any warnings.'
portraitMap: true                  # boolean, controls map image orientation
---
```

Key points:
- `slug` must exactly match the filename without `.md`.
- `title` uses parentheses: `(Out)` or `(Return)`.
- `subtitle` is `Start Location to End Location`. The return file reverses the order.
- `details` keys are: `Map`, `Total Circular Distance`, `Start`, `Comment`. Values are single-quoted strings.
- If a `Comment` value contains an apostrophe, escape it by doubling: `''` (YAML single-quote escaping).
- The out and return files for the same section may have **different** `Start` and `Comment` values, but typically share the same `Map`, `Total Circular Distance`, and `portraitMap`.

### Body content

The walk directions follow immediately after the closing `---` of the frontmatter. There are no headings, no repeated walk series name, no repeated metadata. Just the walking instructions as plain paragraphs separated by blank lines.

## Map images

Map images live in `img/maps/{walk-series-slug}/` and are named `{slug}.jpg` to match the section slug. For example:

```
img/maps/herne-bay-to-hazelmere-robust-ramble/section-14-(out).jpg
img/maps/herne-bay-to-hazelmere-robust-ramble/section-14-(return).jpg
```

The template references maps as: `/img/maps/{{walkSeries}}/{{ slug }}.jpg`

If a single map image covers both directions, copy it to both filenames.

## Common mistake: combined files

Sometimes new sections are entered as a single file (`section-{N}.md`) with both out and return directions in the body, separated by repeated headers like:

```
Robust Ramble

Herne Bay to Hazlemere

Section 14 Out

Stalisfield Green to Doddington

OS Map: Explorer 137 Ashford, Headcorn and Wye

Total Circular Distance: 9 miles/6 hours

Start: Parking at the Plough Inn...

Comment: A varied walk...

[out directions here]

Robust Ramble

Herne Bay to Hazlemere

Section 14 Return

Doddington to Stalisfield Green

OS Map: ...
...

[return directions here]
```

### How to fix combined files

1. **Identify the split point**: find the second occurrence of `Robust Ramble` in the body -- this starts the return section.
2. **Extract metadata** from each half: the lines between the section title and the first direction paragraph contain `OS Map`, `Total Circular Distance`, `Start`, and `Comment` fields. These become the `details` in frontmatter.
3. **Extract the subtitle** from each half: this is the line after the "Section N Out/Return" line (with a blank line between), showing "Place A to Place B".
4. **Extract the directions** from each half: everything after the `Comment:` line (skipping the leading blank line).
5. **Create two new files** with proper frontmatter and only the direction content in the body.
6. **Handle map images**: rename/copy from old naming to match new slugs.
7. **Verify**: ensure the direction text in the new files is byte-identical to the originals. Use diff to compare extracted body content.
8. **Delete** the original combined file and old map files.

### Verification approach

To verify no content was lost or altered during splitting:

```bash
# Extract body from original (skip YAML frontmatter)
BODY=$(awk 'BEGIN{n=0} /^---$/{n++; next} n>=2{print}' original.md)

# Split on second "Robust Ramble"
SPLIT_LINE=$(echo "$BODY" | grep -n "^Robust Ramble$" | tail -1 | cut -d: -f1)

# Extract directions from each half (everything after "Comment:" line, skip leading blanks)
# Then diff against the body of the new file (also extracted after frontmatter)
```

Compare using `diff` with trailing whitespace stripped to catch any content changes.
