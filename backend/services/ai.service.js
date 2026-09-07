// import { GoogleGenAI } from "@google/genai";

// const ai = new GoogleGenAI({});

// const responseSchema = {
//     type: "object",
//     properties: {
//         text: { type: "string", description: "A short explanation to show the user." },
//         fileTree: {
//             type: "object",
//             description: "Map of file paths to their contents. REQUIRED whenever buildCommand or startCommand are present, and required whenever the response text describes code, files, or an app being built. Omit entirely ONLY for plain conversational responses with no code involved.",
//             additionalProperties: {
//                 type: "object",
//                 properties: {
//                     type: { type: "string", enum: ["file"], description: "Always 'file' — folders are implied by path segments, not listed explicitly." },
//                     file: {
//                         type: "object",
//                         properties: { contents: { type: "string" } },
//                         required: ["contents"]
//                     }
//                 },
//                 required: ["type", "file"]
//             }
//         },
//         buildCommand: {
//             type: "object",
//             properties: {
//                 mainItem: { type: "string" },
//                 commands: { type: "array", items: { type: "string" } }
//             }
//         },
//         startCommand: {
//             type: "object",
//             properties: {
//                 mainItem: { type: "string" },
//                 commands: { type: "array", items: { type: "string" } }
//             }
//         }
//     },
//     required: ["text"]
// };

// export const generate_response = async (prompt) => {
//     const response = await ai.models.generateContent({
//         model: "gemini-3.5-flash",
//         contents: prompt,
//         config: {
//             system_instruction: `You are an expert in MERN and full-stack development with 10 years of experience.
//                 Write modular, well-commented, scalable code following best practices, handling errors and edge cases.
//                 CRITICAL RULE: If the user asks you to build, create, or generate any app, component, or code — you MUST populate the "fileTree" field with the actual file contents. Never describe code you have "created" in the "text" field without also including those exact files in "fileTree". A "text" field that claims code was built, combined with a missing "fileTree", is an invalid response.
//                 Every entry in fileTree represents a FILE, and must include "type": "file" alongside its "file.contents".
//                 Use '/' in path keys for folder nesting (e.g. "src/app.js") — do not create separate entries for folders themselves, they are inferred automatically from the paths.
//                 Always include buildCommand and startCommand alongside fileTree when generating a runnable project.
//                 If it's a general greeting or question with no code requested, only fill "text" and omit fileTree/buildCommand/startCommand.`,
//             responseMimeType: "application/json",
//             responseSchema: responseSchema
//         }
//     });

//     return response.text // guaranteed valid JSON matching responseSchema
// }

const responseSchema = {
    type: "object",
    properties: {
        text: { type: "string", description: "A short explanation to show the user." },
        fileTree: {
            type: ["array", "null"],
            description: "List of files to create. Each item is one file. Folders are inferred from '/' in the path. Set to null if no code is being generated.",
            items: {
                type: "object",
                properties: {
                    path: { type: "string", description: "Full file path, e.g. 'src/App.js'. Use '/' for folder nesting." },
                    contents: { type: "string", description: "The full file contents." }
                },
                required: ["path", "contents"],
                additionalProperties: false
            }
        },
        buildCommand: {
            type: ["object", "null"],
            description: "Set to null if no code is being generated.",
            properties: {
                mainItem: { type: "string" },
                commands: { type: "array", items: { type: "string" } }
            },
            required: ["mainItem", "commands"],
            additionalProperties: false
        },
        startCommand: {
            type: ["object", "null"],
            description: "Set to null if no code is being generated.",
            properties: {
                mainItem: { type: "string" },
                commands: { type: "array", items: { type: "string" } }
            },
            required: ["mainItem", "commands"],
            additionalProperties: false
        }
    },
    required: ["text", "fileTree", "buildCommand", "startCommand"],
    additionalProperties: false
};

export const generate_response = async (prompt) => {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [
                {
                    role: "system",
                    content: `You are an expert in MERN and full-stack development with 10 years of experience.
                        Write modular, well-commented, scalable code following best practices, handling errors and edge cases.
                        If the user asks you to build, create, or generate any app, component, or code, you MUST populate "fileTree" with one entry per file, each including its full "path" and "contents", and populate "buildCommand"/"startCommand". A "text" field claiming code was built without a matching "fileTree" is invalid.
                        Use '/' in the "path" value for folder nesting (e.g. "src/App.js") — folders are inferred automatically, do not create separate entries for them.
                        If it's a general greeting or question with no code involved, set "fileTree", "buildCommand", and "startCommand" to null.
                        IMPORTANT: When writing a file's "contents", write the raw source code exactly as it should appear in the file — real line breaks, real quotes. Do NOT manually add backslash-escape characters like \\n or \\" yourself; the JSON encoder handles that automatically. Writing literal backslash-n or backslash-quote sequences into the code is a mistake.
                        Always respond with a JSON object matching the following schema, and nothing else: ${JSON.stringify(responseSchema)}`
                },
                { role: "user", content: prompt }
            ],
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "soen_response",
                    strict: true,
                    schema: responseSchema
                }
            }
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content; // JSON string matching responseSchema
}