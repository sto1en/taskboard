// Проверка регистра относительных импортов.
//
// Windows не различает ../Task и ../task, Linux (Docker, CI) — различает.
// Если импорт написан не в том регистре, локально всё собирается, а в
// контейнере сборка падает с "Could not resolve ...".
//
// Запуск: npm run check:imports
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve, join, relative, basename, parse } from 'node:path'

const ROOT = resolve('src')
const EXTS = ['.js', '.jsx', '.ts', '.tsx', '.json', '.css']
const INDEX_EXTS = EXTS.map(e => `/index${e}`)

function walk(dir, out = []) {
    for (const name of readdirSync(dir)) {
        const full = join(dir, name)
        if (statSync(full).isDirectory()) walk(full, out)
        else if (/\.(jsx?|tsx?)$/.test(name)) out.push(full)
    }
    return out
}

/** Возвращает путь с реальным регистром сегментов или null. */
function actualCase(absPath) {
    const { root } = parse(absPath)
    let cur = root
    for (const seg of absPath.slice(root.length).split(/[\\/]/)) {
        let entries
        try { entries = readdirSync(cur) } catch { return null }
        const found = entries.find(e => e.toLowerCase() === seg.toLowerCase())
        if (!found) return null
        cur = join(cur, found)
    }
    return cur
}

/** Подбирает реальный файл под импорт (учитывая расширения и index). */
function resolveImport(fromFile, spec) {
    const base = resolve(dirname(fromFile), spec)
    const candidates = [base, ...EXTS.map(e => base + e), ...INDEX_EXTS.map(e => base + e)]
    for (const candidate of candidates) {
        const actual = actualCase(candidate)
        if (actual) {
            // exact — спецификатор уже записан в правильном регистре
            // (путь-кандидат совпал с реальным посимвольно).
            return { actual, exact: actual === candidate }
        }
    }
    return null
}

function check({ fix = false } = {}) {
    const problems = []
    for (const file of walk(ROOT)) {
        let code = readFileSync(file, 'utf8')
        let changed = false
        code = code.replace(
            /((?:from\s+|import\s*\(\s*)['"])(\.[^'"]+)(['"])/g,
            (match, pre, spec, post) => {
                const found = resolveImport(file, spec)
                if (!found) {
                    problems.push(`${rel(file)}: ${spec} — файл не найден`)
                    return match
                }
                const { actual, exact } = found

                if (exact) return match

                // Приводим спецификатор к реальному регистру, сохраняя стиль
                // (без расширения, если его не было, и без /index).
                const hadExt = EXTS.some(e => spec.endsWith(e))
                let target = actual
                if (!hadExt) {
                    const name = basename(actual)
                    const ext = EXTS.find(e => name.endsWith(e))
                    if (ext && name === `index${ext}`) target = dirname(actual)
                    else if (ext) target = actual.slice(0, -ext.length)
                }
                let next = relative(dirname(file), target).split(/[\\/]/).join('/')
                if (!next.startsWith('.')) next = `./${next}`

                problems.push(`${rel(file)}: ${spec} → ${next}`)
                changed = true
                return `${pre}${next}${post}`
            },
        )
        if (changed && fix) {
            writeFileSync(file, code)
        }
    }
    return problems
}

function rel(p) {
    return relative(process.cwd(), p).split(/[\\/]/).join('/')
}

const fix = process.argv.includes('--fix')
const problems = check({ fix })

if (problems.length === 0) {
    console.log('OK: регистр всех относительных импортов совпадает с файлами')
} else {
    console.log(problems.join('\n'))
    console.log(`\n${problems.length} проблем(ы)${fix ? ' — исправлено' : '. Запустите с --fix'}`)
    if (!fix) process.exitCode = 1
}
