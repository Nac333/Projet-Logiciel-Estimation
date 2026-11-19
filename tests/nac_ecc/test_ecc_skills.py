"""Static and offline verification of two selected ECC project skills.

These tests do not install ECC, run MCP servers, access user data, or test PDF geometry.
Run: python3 -m unittest discover -s tests/nac_ecc -v
"""
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SKILLS = ROOT / ".agents" / "skills"
SELECTED = ("content-hash-cache-pattern", "mcp-dependency-review")
NAC = SKILLS / "const-ia-takeoff-nac"


def split_frontmatter(contents: str) -> tuple[str, str]:
    parts = contents.split("---", 2)
    if len(parts) != 3 or parts[0] != "":
        raise AssertionError("Frontmatter YAML delimiters missing")
    return parts[1], parts[2]


class ECCSkillsOfflineTests(unittest.TestCase):
    def test_selected_skill_files_and_names(self):
        for name in SELECTED:
            with self.subTest(skill=name):
                base = SKILLS / name
                skill = base / "SKILL.md"
                self.assertTrue(skill.is_file(), str(skill))
                raw = skill.read_text(encoding="utf-8")
                yaml, body = split_frontmatter(raw)
                self.assertRegex(yaml, rf"(?m)^name:\s*{re.escape(name)}\s*$")
                self.assertRegex(yaml, r"(?m)^description:\s*>-\s*$")
                self.assertTrue(len(body) > 500, "Skill body unexpectedly short")
                self.assertNotIn("hooks:", yaml, "No global/automatic hooks are allowed")
                self.assertTrue((base / "agents" / "openai.yaml").is_file())
                license_text = (base / "LICENSE").read_text(encoding="utf-8")
                self.assertIn("MIT License", license_text)
                self.assertIn("Affaan Mustafa", license_text)

    def test_local_first_and_static_review_guardrails(self):
        cache = (SKILLS / SELECTED[0] / "SKILL.md").read_text(encoding="utf-8")
        mcp = (SKILLS / SELECTED[1] / "SKILL.md").read_text(encoding="utf-8")
        self.assertIn("Quantif Plancher V7", cache)
        self.assertIn("SHA-256", cache)
        self.assertIn("échelle", cache)
        self.assertIn("Ne **jamais** utiliser uniquement", cache)
        self.assertIn("Ne **jamais**", mcp)
        self.assertIn("statique", mcp)
        self.assertIn("config", mcp.lower())

    def test_nac_reference_is_present(self):
        nac_skill = (NAC / "SKILL.md").read_text(encoding="utf-8")
        reference = NAC / "references" / "ecc-selection-et-workflows-codex.md"
        self.assertTrue(reference.is_file())
        self.assertIn("(references/ecc-selection-et-workflows-codex.md)", nac_skill)
        self.assertIn("cache", reference.read_text(encoding="utf-8").lower())
        self.assertIn("327", reference.read_text(encoding="utf-8"))

    def test_codex_guides_route_without_installing_ecc(self):
        agents = (ROOT / "AGENTS.md").read_text(encoding="utf-8")
        guide = (ROOT / "docs" / "NAC_ECC_CODEX.md").read_text(encoding="utf-8")
        self.assertIn("$content-hash-cache-pattern", agents)
        self.assertIn("$mcp-dependency-review", agents)
        self.assertIn("Ne pas installer le pack", agents)
        self.assertIn("NON EXÉCUTÉS", guide)
        self.assertIn("Quantif-Plancher-V7.html", guide)


if __name__ == "__main__":
    unittest.main()
