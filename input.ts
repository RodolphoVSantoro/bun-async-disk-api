export async function input(){
    let allText = "";
    for await (const chunk of Bun.stdin.stream()) {
        const chunkText = Buffer.from(chunk).toString();
        allText += chunkText;
        if (chunkText.includes('\n')) {
            break;
        }
    }
    return allText.trim();
}