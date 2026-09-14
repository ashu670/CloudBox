function generateInviteCode() {

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let code = "CBX-";

    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters[randomIndex];
    }

    return code;
}

export default generateInviteCode;