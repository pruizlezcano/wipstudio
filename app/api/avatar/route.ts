// https://github.com/boringdesigners/boring-avatars

import { NextRequest, NextResponse } from 'next/server';

// Utility functions from Boring Avatars
const hashCode = (name: string): number => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        const character = name.charCodeAt(i);
        hash = ((hash << 5) - hash) + character;
        hash = hash & hash;
    }
    return Math.abs(hash);
};

const getUnit = (number: number, range: number, index?: number): number => {
    const value = number % range;
    if (index && ((Math.floor((number / Math.pow(10, index)) % 10) % 2) === 0)) {
        return -value;
    }
    return value;
};

const getRandomColor = (number: number, colors: string[], range: number): string => {
    return colors[number % range];
};

// Generate unique color palette per user
function generateUserPalette(userId: string): string[] {
    const hash = hashCode(userId);
    const palettes = [
        ["#4a3333", "#e1473f", "#9a9088", "#80b0ab", "#dbd1b3"],
        ["#f6b149", "#f8572d", "#df2a33", "#a22543", "#6b312d"],
        ["#512b52", "#635274", "#7bb0a8", "#a7dbab", "#e4f5b1"],
        ["#3d0a49", "#5015bd", "#027fe9", "#00caf8", "#e0daf7"],
        ["#b1e6d1", "#77b1a9", "#3d7b80", "#270a33", "#451a3e"],
        ["#f00065", "#fa9f43", "#f9fad2", "#262324", "#b3dbc8"]
    ];

    return palettes[hash % palettes.length];
}

// Marble Avatar Generator
const ELEMENTS = 3;
const SIZE = 80;

function generateMarbleColors(name: string, colors: string[]) {
    const numFromName = hashCode(name);
    const range = colors && colors.length;

    return Array.from({ length: ELEMENTS }, (_, i) => ({
        color: getRandomColor(numFromName + i, colors, range),
        translateX: getUnit(numFromName * (i + 1), SIZE / 10, 1),
        translateY: getUnit(numFromName * (i + 1), SIZE / 10, 2),
        scale: 1.2 + getUnit(numFromName * (i + 1), SIZE / 20) / 10,
        rotate: getUnit(numFromName * (i + 1), 360, 1),
    }));
}

function generateMarbleSVG(name: string, colors: string[], size: number, square: boolean = false): string {
    const properties = generateMarbleColors(name, colors);
    const maskID = `mask_${hashCode(name)}`;
    const filterID = `filter_${hashCode(name)}`;
    const scale = size / SIZE;

    return `<svg viewBox="0 0 ${SIZE} ${SIZE}" fill="none" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <mask id="${maskID}" maskUnits="userSpaceOnUse" x="0" y="0" width="${SIZE}" height="${SIZE}">
      <rect width="${SIZE}" height="${SIZE}" ${square ? '' : `rx="${SIZE * 2}"`} fill="#FFFFFF" />
    </mask>
    <g mask="url(#${maskID})">
      <rect width="${SIZE}" height="${SIZE}" fill="${properties[0].color}" />
      <path
        filter="url(#${filterID})"
        d="M32.414 59.35L50.376 70.5H72.5v-71H33.728L26.5 13.381l19.057 27.08L32.414 59.35z"
        fill="${properties[1].color}"
        transform="translate(${properties[1].translateX} ${properties[1].translateY}) rotate(${properties[1].rotate} ${SIZE / 2} ${SIZE / 2}) scale(${properties[2].scale})"
      />
      <path
        filter="url(#${filterID})"
        style="mix-blend-mode: overlay"
        d="M22.216 24L0 46.75l14.108 38.129L78 86l-3.081-59.276-22.378 4.005 12.972 20.186-23.35 27.395L22.215 24z"
        fill="${properties[2].color}"
        transform="translate(${properties[2].translateX} ${properties[2].translateY}) rotate(${properties[2].rotate} ${SIZE / 2} ${SIZE / 2}) scale(${properties[2].scale})"
      />
    </g>
    <defs>
      <filter id="${filterID}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feGaussianBlur stdDeviation="7" result="effect1_foregroundBlur" />
      </filter>
    </defs>
  </svg>`;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json(
            { error: 'userId parameter is required' },
            { status: 400 }
        );
    }

    const size = parseInt(searchParams.get('size') || '120');
    const colorParam = searchParams.get('colors');
    const colors = colorParam
        ? colorParam.split(',').map(c => c.startsWith('#') ? c : `#${c}`)
        : generateUserPalette(userId);

    const svgData = generateMarbleSVG(userId, colors, size, true);

    return new NextResponse(svgData, {
        status: 200,
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    });
}