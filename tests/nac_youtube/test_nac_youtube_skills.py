"""Smoke tests offline pour les deux compétences YouTube NAC.

Données synthétiques uniquement; aucune transcription YouTube ni API externe.
Lancer: python3 -m unittest discover -s tests/nac_youtube -v
"""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
VIRAL = ROOT / ".agents/skills/yt-viral/swipe.py"
CHAPTERS_DIR = ROOT / ".agents/skills/yt-chapters"
CHAPTERS = CHAPTERS_DIR / "chapters.py"


def run_script(script: Path, fixture: Path, *options: str):
    return subprocess.run(
        [sys.executable, str(script), str(fixture), *options],
        check=False,
        text=True,
        capture_output=True,
        timeout=15,
    )


def timestamp(seconds: int) -> str:
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    return f"{h:02d}:{m:02d}:{s:02d},000"


class NACYouTubeSkillsTests(unittest.TestCase):
    def test_viral_median_and_ratio(self):
        rows = [
            {"channel": "Demo NAC", "title": f"Vidéo PDF {i}", "views": views,
             "url": f"https://example.invalid/{i}"}
            for i, views in enumerate([10, 10, 10, 90])
        ]
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "videos.json"
            path.write_text(json.dumps(rows), encoding="utf-8")
            r = run_script(VIRAL, path, "--min", "2.0", "--json")
        self.assertEqual(r.returncode, 0, r.stderr)
        result = json.loads(r.stdout)
        self.assertEqual(len(result["outliers"]), 1)
        self.assertEqual(result["outliers"][0]["views"], 90)
        self.assertEqual(result["outliers"][0]["median"], 10)
        self.assertEqual(result["outliers"][0]["multiple"], 9.0)

    def test_viral_needs_four_videos_per_channel(self):
        rows = [{"channel": "Demo NAC", "title": "PDF", "views": v} for v in [10, 25, 90]]
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "videos.json"
            path.write_text(json.dumps(rows), encoding="utf-8")
            r = run_script(VIRAL, path, "--json")
        self.assertEqual(r.returncode, 0, r.stderr)
        data = json.loads(r.stdout)
        self.assertEqual(data["outliers"], [])
        self.assertEqual(data["skipped_thin_channels"][0][1], 3)

    def test_chapters_valid_srt(self):
        lines = []
        for i in range(12):
            start = i * 22
            end = start + 7
            topic = "detection de pieces céramique géométrie" if i < 6 else "plans PDF estimation et surfaces"
            lines.append(f"{i + 1}\n{timestamp(start)} --> {timestamp(end)}\n{topic}\n")
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "synthetic.srt"
            path.write_text("\n".join(lines), encoding="utf-8")
            r = run_script(CHAPTERS, path, "--target", "6", "--json")
        self.assertEqual(r.returncode, 0, r.stderr)
        data = json.loads(r.stdout)
        self.assertTrue(data["valid"], data)
        self.assertGreaterEqual(len(data["chapters"]), 3)
        self.assertEqual(data["chapters"][0]["start"], 0)
        self.assertTrue(all(c["seconds"] >= 10 for c in data["chapters"]))

    def test_chapters_refuse_short_transcript(self):
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "short.srt"
            path.write_text(
                "1\n00:00:00,000 --> 00:00:06,000\nTest PDF\n\n"
                "2\n00:00:08,000 --> 00:00:12,000\nAutre sujet\n",
                encoding="utf-8",
            )
            r = run_script(CHAPTERS, path, "--json")
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("too few cues", r.stdout)

    def test_chapters_unicode_french_keywords(self):
        sys.path.insert(0, str(CHAPTERS_DIR))
        try:
            from chapters import keywords
            words = keywords("céramique géométrie échelle surface")
            self.assertIn("céramique", words)
            self.assertIn("géométrie", words)
            self.assertIn("échelle", words)
        finally:
            sys.path.remove(str(CHAPTERS_DIR))


if __name__ == "__main__":
    unittest.main()
