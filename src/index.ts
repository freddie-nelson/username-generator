import { adjectives, femaleNames, lastNames, maleNames, nouns } from "./lists";

function getRandomItem(list: string[]) {
    return list[Math.floor(Math.random() * list.length)];
}

function replace(str: string, start: number, end: number, value: string) {
    return str.slice(0, start) + value + str.slice(end);
}

// formatters
function capitalize(words: string[]) {
    return words.map((word) => word[0].toUpperCase() + word.slice(1));
}

// builders
function title(words: string[], gender: "m" | "f" | "all" = "all") {
    const maleTitles = ["mr", "dr"];
    const femaleTitles = ["mrs", "ms", "miss", "dr"];

    return getRandomItem(
        gender === "all"
            ? [...maleTitles, ...femaleTitles.filter((t) => t !== "dr")]
            : gender === "m"
            ? maleTitles
            : femaleTitles,
    );
}

function adjective(words: string[]) {
    return getRandomItem(adjectives.filter((a) => !words.includes(a)));
}

function noun(words: string[]) {
    return getRandomItem(nouns.filter((n) => !words.includes(n)));
}

function firstname(words: string[], gender: "m" | "f" | "all") {
    const names =
        gender === "all"
            ? [...maleNames, ...femaleNames]
            : gender === "m"
            ? maleNames
            : femaleNames;
    return getRandomItem(names.filter((n) => !words.includes(n)));
}

function lastname(words: string[]) {
    return getRandomItem(lastNames.filter((n) => !words.includes(n)));
}

function number(words: string[], min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min).toString();
}

export type PlaceholderType =
    | "adj"
    | "noun"
    | "firstname"
    | "lastname"
    | "number"
    | "title";

const validPlaceholders: PlaceholderType[] = [
    "adj",
    "noun",
    "firstname",
    "lastname",
    "number",
    "title",
];

export interface Placeholder {
    type: PlaceholderType;
    start: number;
    length: number;
    style: "capitalize" | "lowercase" | "uppercase";
    data?: any;
}

function extractPlaceholders(template: string) {
    const split = template.split("{{");

    let charIndex = 0;

    const placeholders: Placeholder[] = split
        .map((part, i) => {
            charIndex += part.length;

            // add 2 to the char index to account for the `{{` characters
            if (i > 0) charIndex += 2;

            if (!part.includes("}}")) return null;

            let placeholder = part.split("}}")[0];
            let data = null;

            // minus 2 to the start index to account for the `{{` characters
            const start = charIndex - part.length - 2;

            // add 4 to account for border braces
            const length = placeholder.length + 4;

            let style = "lowercase";
            if (placeholder.startsWith("^^")) {
                placeholder = placeholder.slice(2);
                style = "uppercase";
            } else if (placeholder.startsWith("^")) {
                placeholder = placeholder.slice(1);
                style = "capitalize";
            }

            if (
                (placeholder.includes("firstname") ||
                    placeholder.includes("number")) &&
                !placeholder.includes(":")
            )
                throw new Error("Missing data for placeholder.");

            if (placeholder.includes(":")) {
                let temp = placeholder.split(":");
                placeholder = temp[0];

                if (placeholder === "number" && temp.length === 3) {
                    data = {
                        min: parseInt(temp[1]),
                        max: parseInt(temp[2]),
                    };

                    if (data.min > data.max)
                        throw new Error("Min cannot be greater than max.");
                } else if (
                    placeholder === "firstname" ||
                    (placeholder === "title" && temp.length === 2)
                ) {
                    data = {
                        gender: temp[1],
                    };

                    if (
                        data.gender !== "m" &&
                        data.gender !== "f" &&
                        data.gender !== "all"
                    )
                        throw new Error("Invalid gender.");
                } else {
                    throw new Error("Invalid placeholder.");
                }
            }

            if (!validPlaceholders.includes(placeholder as PlaceholderType))
                throw new Error("Invalid placeholder.");

            return {
                type: placeholder as PlaceholderType,
                start,
                length,
                style,
                data,
            };
        })
        .filter((p) => p !== null) as Placeholder[];

    return placeholders;
}

function placeholderToWord(placeholder: Placeholder, words: string[]) {
    let word = "";

    switch (placeholder.type) {
        case "adj":
            word = adjective(words);
            break;
        case "noun":
            word = noun(words);
            break;
        case "firstname":
            word = firstname(words, placeholder.data.gender);
            break;
        case "lastname":
            word = lastname(words);
            break;
        case "number":
            word = number(words, placeholder.data.min, placeholder.data.max);
            break;
        case "title":
            word = title(words);
            break;
        default:
            throw new Error("Invalid placeholder.");
    }

    if (placeholder.style === "capitalize")
        word = word[0].toUpperCase() + word.slice(1);
    else if (placeholder.style === "uppercase") word = word.toUpperCase();
    else word = word.toLowerCase();

    return word;
}

/**
 * Generates a random username based on the given template.
 *
 * The template is a string that can contain the placeholders:
 * - `{{adj}}` - A random adjective.
 * - `{{noun}}` - A random noun.
 * - `{{firstname:gender}}` - A random first name. gender can be `m`, `f` or `all`.
 * - `{{lastname}}` - A random last name.
 * - `{{number:min:max}}` - A random number between `min` and `max`.
 * - `{{title:gender}}` - A random title. gender can be `m`, `f` or `all`.
 *
 * An example template could be `{{adj}}{{noun}}{{number:100:999}}`.
 *
 * This template would generate a username like `bluecat123`.
 *
 * Additionally any placeholder can be capitalized by adding a `^` before the placeholder name,
 * or made uppercase by adding `^^` before the placeholder name.
 *
 * @param template The template to use for generating the username.
 * @returns The generated username.
 */
function generateUsername(template: string) {
    let s = "";

    const placeholders = extractPlaceholders(template);
    const words: string[] = [];

    let lastPlaceholder: Placeholder = null;

    for (const p of placeholders) {
        // add the text between the last placeholder and this one
        const before = template.slice(
            lastPlaceholder
                ? lastPlaceholder.start + lastPlaceholder.length
                : 0,
            p.start,
        );
        s += before;

        const word = placeholderToWord(p, words);
        words.push(word);

        // add the new word
        s += word;

        lastPlaceholder = p;
    }

    return s;
}

const u = generateUsername("{{firstname:all}}.{{noun}}.{{number:100:999}}");
console.log(u);
