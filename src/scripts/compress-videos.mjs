// Skrypt kompresuje lokalne wideo w public/assets/videos/ (mp4 + webm, rekurencyjnie).
// Uzywa ffmpeg z @ffmpeg-installer/ffmpeg. Dla kazdego pliku:
//   - wykrywa wysokosc (crf 26 gdy <=1280, inaczej crf 28)
//   - skaluje tylko w dol (max szerokosc 1920), zachowujac proporcje
//   - webm konwertuje do mp4 i usuwa zrodlo, jesli nowy plik powstanie poprawnie
// Bledy per-plik nie przerywaja calosci.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;

const VIDEOS_DIR = path.resolve("public/assets/videos");
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm"]);

// Gdy nie ma katalogu wideo (projekt bez lokalnych filmow), konczymy cicho.
if (!fs.existsSync(VIDEOS_DIR)) {
  console.log("compress-videos: brak public/assets/videos, nic do kompresji.");
  process.exit(0);
}

// Rekurencyjnie zbiera pliki wideo z podanego katalogu.
function collectVideos(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectVideos(full));
    } else if (VIDEO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      results.push(full);
    }
  }
  return results;
}

// Uruchamia ffmpeg i zwraca tekst stderr (tam ffmpeg wypisuje diagnostyke).
function runFfmpeg(args) {
  try {
    execFileSync(ffmpegPath, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return "";
  } catch (err) {
    return String(err?.stderr || "");
  }
}

// Wykrywa wysokosc klatki przez odczyt informacji o strumieniu z `-i input`.
function probeHeight(input) {
  const stderr = runFfmpeg(["-hide_banner", "-i", input]);
  const videoLine = stderr.split("\n").find((line) => line.includes("Video:"));
  if (!videoLine) return null;
  const match = videoLine.match(/(\d{2,5})x(\d{2,5})/);
  return match ? parseInt(match[2], 10) : null;
}

function formatMb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

const files = collectVideos(VIDEOS_DIR);
console.log(`Znaleziono ${files.length} plikow wideo.`);
console.log("-".repeat(70));

let totalBefore = 0;
let totalAfter = 0;
let convertedCount = 0;
let skippedCount = 0;

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  const before = fs.statSync(file).size;
  totalBefore += before;

  try {
    const height = probeHeight(file);
    const crf = height !== null && height <= 1280 ? "26" : "28";
    const isWebm = ext === ".webm";

    // webm -> mp4 (finalna nazwa), mp4 -> plik tymczasowy w tym samym katalogu.
    const finalTarget = isWebm ? file.replace(/\.webm$/i, ".mp4") : file;
    const tmp = `${finalTarget}.tmp.mp4`;

    // Skala tylko w dol: min(1920, iw) ogranicza szerokosc, -2 pilnuje parzystosci wysokosci.
    const args = [
      "-y",
      "-i", file,
      "-c:v", "libx264",
      "-preset", "slow",
      "-crf", crf,
      "-vf", "scale='min(1920,iw)':-2",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      tmp,
    ];

    const start = Date.now();
    runFfmpeg(args);
    const elapsedSec = ((Date.now() - start) / 1000).toFixed(1);

    if (!fs.existsSync(tmp) || fs.statSync(tmp).size === 0) {
      throw new Error("ffmpeg nie utworzyl pliku wyjsciowego");
    }

    // Nadpisz oryginal skompresowanym. Na Windows fs.rename nie nadpisuje
    // istniejacego pliku (EPERM), wiec najpierw usuwamy oryginal.
    // Tmp jest juz zweryfikowany (istnieje, niezerowy), wiec nie tracimy danych.
    try {
      fs.renameSync(tmp, finalTarget);
    } catch (renameErr) {
      if (renameErr.code === "EPERM" || renameErr.code === "EEXIST") {
        fs.rmSync(finalTarget);
        fs.renameSync(tmp, finalTarget);
      } else {
        throw renameErr;
      }
    }
    if (isWebm) {
      // Usun zrodlo webm dopiero gdy mp4 powstalo poprawnie.
      fs.rmSync(file);
      convertedCount++;
    }

    const after = fs.statSync(finalTarget).size;
    totalAfter += after;
    const savedPct = before > 0 ? (((before - after) / before) * 100).toFixed(1) : "0.0";
    console.log(
      `${path.relative(VIDEOS_DIR, file)} -> ${path.relative(VIDEOS_DIR, finalTarget)} | ` +
      `${formatMb(before)} -> ${formatMb(after)} (${savedPct}%) | crf ${crf} | ${elapsedSec}s`
    );
  } catch (err) {
    skippedCount++;
    console.error(`BLAD dla ${file}: ${err.message}`);
  }
}

console.log("-".repeat(70));
console.log(`Razem przed: ${formatMb(totalBefore)}`);
console.log(`Razem po:   ${formatMb(totalAfter)}`);
console.log(`Konwersje webm->mp4: ${convertedCount}, pliki z bledem: ${skippedCount}`);
