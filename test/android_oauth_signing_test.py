import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from validate_android_oauth_signing import android_oauth_sha1s, normalize_sha1


class AndroidOauthSigningTests(unittest.TestCase):
    def test_normalizes_colons_and_case(self):
        self.assertEqual(normalize_sha1("E3:74:72:C4:CD:0D:B0:E3:76:9E:75:4C:DB:DE:5A:E3:86:33:C7:56"),
                         "e37472c4cd0db0e3769e754cdbde5ae38633c756")

    def test_extracts_only_android_oauth_certificate_for_target_package(self):
        config = {
            "client": [
                {
                    "client_info": {"android_client_info": {"package_name": "com.taget.app"}},
                    "oauth_client": [
                        {"client_type": 1, "android_info": {
                            "package_name": "com.taget.app",
                            "certificate_hash": "E3:74:72:C4:CD:0D:B0:E3:76:9E:75:4C:DB:DE:5A:E3:86:33:C7:56",
                        }},
                        {"client_type": 3, "client_id": "web-client"},
                    ],
                },
                {
                    "client_info": {"android_client_info": {"package_name": "com.other.app"}},
                    "oauth_client": [{"client_type": 1, "android_info": {
                        "package_name": "com.other.app", "certificate_hash": "0" * 40,
                    }}],
                },
            ]
        }
        self.assertEqual(android_oauth_sha1s(config, "com.taget.app"),
                         {"e37472c4cd0db0e3769e754cdbde5ae38633c756"})

    def test_rejects_invalid_fingerprint(self):
        with self.assertRaises(ValueError):
            normalize_sha1("not-a-sha1")


if __name__ == "__main__":
    unittest.main()
