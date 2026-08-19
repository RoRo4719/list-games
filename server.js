const http = require("http");
const { URLSearchParams } = require("url");
const fs = require("fs");
require("dotenv").config();

let accessToken = null;

const computerPlatforms = new Set([
    3,    // Linux
    6,    // PC (Microsoft Windows)
    13,   // DOS
    14,   // Mac
    15,   // Commodore C64/128/MAX
    16,   // Amiga
    25,   // Amstrad CPC
    26,   // ZX Spectrum
    27,   // MSX
    53,   // MSX2
    63,   // Atari ST/STE
    65,   // Atari 8-bit
    69,   // BBC Microcomputer System
    71,   // Commodore VIC-20
    75,   // Apple II
    77,   // Sharp X1
    90,   // Commodore PET
    93,   // Commodore 16
    94,   // Commodore Plus/4
    95,   // PDP-1
    96,   // PDP-10
    97,   // PDP-8
    98,   // DEC GT40
    101,  // Ferranti Nimrod Computer
    103,  // PDP-7
    104,  // HP 2100
    105,  // HP 3000
    106,  // SDS Sigma 7
    107,  // Call-A-Computer time-shared mainframe computer system
    108,  // PDP-11
    109,  // CDC Cyber 70
    110,  // PLATO
    111,  // Imlac PDS-1
    112,  // Microcomputer
    115,  // Apple IIGS
    116,  // Acorn Archimedes
    118,  // FM Towns
    121,  // Sharp X68000
    125,  // PC-8800 Series
    126,  // TRS-80
    129,  // Texas Instruments TI-99
    134,  // Acorn Electron
    142,  // PC-50X Family
    149,  // PC-9800 Series
    151,  // TRS-80 Color Computer
    152,  // FM-7
    153,  // Dragon 32/64
    154,  // Amstrad PCW
    155,  // Tatung Einstein
    156,  // Thomson MO5
    157,  // NEC PC-6000 Series
    236,  // Exidy Sorcerer
    237,  // Sol-20
    374,  // Sharp MZ-2200
    373,  // Sinclair ZX81
    406,  // Sinclair QL
    409,  // Legacy Computer
    481   // Tomy Tutor / Pyuta / Grandstand Tutor
]);

const consolePlatforms = new Set([
    4,    // Nintendo 64
    5,    // Wii
    7,    // PlayStation
    8,    // PlayStation 2
    9,    // PlayStation 3
    11,   // Xbox
    12,   // Xbox 360
    18,   // Nintendo Entertainment System
    19,   // Super Nintendo Entertainment System
    21,   // Nintendo GameCube
    23,   // Dreamcast
    29,   // Sega Mega Drive/Genesis
    30,   // Sega 32X
    32,   // Sega Saturn
    41,   // Wii U
    48,   // PlayStation 4
    49,   // Xbox One
    50,   // 3DO Interactive Multiplayer
    58,   // Super Famicom
    59,   // Atari 2600
    60,   // Atari 7800
    62,   // Atari Jaguar
    64,   // Sega Master System/Mark III
    67,   // Intellivision
    68,   // ColecoVision
    70,   // Vectrex
    72,   // Ouya
    78,   // Sega CD
    80,   // Neo Geo AES
    84,   // SG-1000
    86,   // TurboGrafx-16/PC Engine
    88,   // Odyssey
    91,   // Bally Astrocade
    99,   // Family Computer
    114,  // Amiga CD32
    117,  // Philips CD-i
    127,  // Fairchild Channel F
    128,  // PC Engine SuperGrafx
    131,  // Super NES CD-ROM System
    133,  // Odyssey 2 / Videopac G7000
    135,  // Hyper Neo Geo 64
    136,  // Neo Geo CD
    138,  // VC 4000
    139,  // 1292 Advanced Programmable Video System
    150,  // Turbografx-16/PC Engine CD
    158,  // Commodore CDTV
    167,  // PlayStation 5
    169,  // Xbox Series X|S
    170,  // Google Stadia
    240,  // Zeebo
    274,  // PC-FX
    308,  // Playdia
    309,  // Evercade
    339,  // Sega Pico
    375,  // Epoch Cassette Vision
    376,  // Epoch Super Cassette Vision
    380,  // Casio Loopy
    382,  // Intellivision Amico
    407,  // HyperScan
    473,  // Arcadia 2001
    476,  // Apple Pippin
    478,  // Panasonic M2
    480,  // Super A'Can
    482,  // Sega CD 32X
    506,  // Amstrad GX4000
    508,  // Nintendo Switch 2
    509   // Polymega
]);

const mobilePlatforms = new Set([
    22,   // Game Boy Color
    24,   // Game Boy Advance
    33,   // Game Boy
    34,   // Android
    35,   // Sega Game Gear
    37,   // Nintendo 3DS
    38,   // PlayStation Portable
    39,   // iOS
    42,   // N-Gage
    46,   // PlayStation Vita
    57,   // WonderSwan
    73,   // BlackBerry OS
    74,   // Windows Phone
    119,  // Neo Geo Pocket
    120,  // Neo Geo Pocket Color
    123,  // WonderSwan Color
    124,  // SwanCrystal
    137,  // New Nintendo 3DS
    159,  // Nintendo DSi
    166,  // Pokémon mini
    307,  // Game & Watch
    379,  // Game.com
    381,  // Playdate
    408,  // Mega Duck/Cougar Boy
    415,  // Watara/QuickShot Supervision
    417,  // Palm OS
    474,  // Gizmondo
    486,  // Digiblast
    507   // Advanced Pico Beena
]);

const vrPlatforms = new Set([
    161,  // Windows Mixed Reality
    162,  // Oculus VR
    163,  // SteamVR
    164,  // Daydream
    165,  // PlayStation VR
    384,  // Oculus Quest
    385,  // Oculus Rift
    386,  // Meta Quest 2
    387,  // Oculus Go
    388,  // Gear VR
    390,  // PlayStation VR2
    471   // Meta Quest 3
]);

const arcadePlatforms = new Set([
    52,   // Arcade
    79    // Neo Geo MVS
]);

const acceptedPlatforms = new Set([
    ...computerPlatforms,
    ...consolePlatforms,
    ...mobilePlatforms,
    ...vrPlatforms,
    ...arcadePlatforms
]);

function hasAcceptedPlatform(game) {
    let platforms = game.platforms || [];
    return platforms.some(platform => acceptedPlatforms.has(platform.id));
}


const server = http.createServer(async (request, response) => {
    response.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
    });

    const url = new URL(request.url, "https://list-games.onrender.com/?game=");
    let gameName = url.searchParams.get("game");
    let bestGame = null;

    if (accessToken === null) {
        accessToken = await getAccessToken();
    }
    
    if (gameName !== null) {
        let games = await searchIGDB(gameName, accessToken);

        bestGame = chooseBestGame(games, gameName);
    }

    let isValid;

    if (bestGame !== null) {
        isValid = hasAcceptedPlatform(bestGame); 
    } else {
        isValid = false;
    }

    response.end(JSON.stringify({
        valid: isValid,
        matchedGame: bestGame
    }));
    
});

async function getAccessToken() {
    let response = await fetch(
        "https://id.twitch.tv/oauth2/token",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                client_id: process.env.TWITCH_CLIENT_ID,
                client_secret: process.env.TWITCH_CLIENT_SECRET,
                grant_type: "client_credentials"
            })
        }
    );

    let data = await response.json();

    return data.access_token;

}

async function getPlatforms(accessToken) {
    let response = await fetch(
        "https://api.igdb.com/v4/platforms",
    {
        method: "POST",
        headers: {
            "Client-ID": process.env.TWITCH_CLIENT_ID,
            "Authorization": "Bearer " + accessToken,
            "Content-Type": "text/plain"
        },
        body: "fields id, name, category; limit 500;"
    }
    );

    let data = await response.json();

    return data;
}

async function searchIGDB(gameName, accessToken) {
    let response = await fetch(
        "https://api.igdb.com/v4/games",
        {
            method: "POST",
            headers: {
                "Client-ID": process.env.TWITCH_CLIENT_ID,
                "Authorization": "Bearer " + accessToken,
                "Content-Type": "text/plain"
            },
            body: `search "${gameName}"; fields name, platforms.name, total_rating_count; limit 10;`
        }
    );
    let data = await response.json();
    
    return data;
}

function romanToNumber(text) {
    return text
    .replace(/\bii\b/gi, "2")
    .replace(/\biii\b/gi, "3")
    .replace(/\biv\b/gi, "4")
    .replace(/\bv\b/gi, "5");
}


function normalizeText(text) {
    return romanToNumber(text.trim().toLowerCase()).replace(/[^\w\s]/g, "");
}

const gameAliases = {
    "skyrim": "the elder scrolls v skyrim",
    "fallout": "fallout a post nuclear role playing game"
};

function chooseBestGame(games, gameName) {

    let normalizedGameName = normalizeText(gameName);
    let key = normalizedGameName;

    if (key in gameAliases) {
        normalizedGameName = gameAliases[key];
    }

    const bundleWords = ["bundle", "trilogy", "collection", "complete edition", "pack",
        "anthology", "game of the year", "soundtrack", "demo"]

    const inputWords = normalizedGameName.split(" ");

    let bestGame = null;
    let bestScore = 0;
    
    for (const game of games) {

        const name = normalizeText(game.name);
        const gameWords = name.split(" ");

        let score = 0;

        for (const word of inputWords) {
            if (gameWords.includes(word)) {
                score += 20;
            }
        }

        if (inputWords.every(word => gameWords.includes(word))) {
            score += 50;
        }

        if (name === normalizedGameName) {
            score += 100;
        }

        else if (name.startsWith(normalizedGameName)) {
            score += 80;
        }

        // Penalize extra words in the game title
        const extraWords = gameWords.length - inputWords.length;
        score -= extraWords * 5;

        if (bundleWords.some(bWord => gameWords.includes(bWord))) {
            score -= 100;
        }

        let gameRatingCount = game.total_rating_count || 0;

        if (score > bestScore) {
            bestScore = score;
            bestGame = game;
        }

        if (bestGame !== null && score === bestScore) {

            let bestGameRatingCount = bestGame.total_rating_count || 0;

            if (gameRatingCount > bestGameRatingCount) {
                bestGame = game;
            }
        }
    }
    
    return bestGame;
}




server.listen(3000, async () => {
    console.log("Server running at http://localhost:3000");

    if (accessToken === null) {
        accessToken = await getAccessToken();
    }

    let testingGame = "Portal";

    const games = await searchIGDB(testingGame, accessToken);

    const bestGame = chooseBestGame(games, testingGame);

    //console.log("Best Game:", bestGame);
    //console.log(games);
    //await getPlatforms(accessToken);
});