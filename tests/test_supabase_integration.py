import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / 'config' / 'supabase.example.json'
CLIENT_PATH = ROOT / 'scripts' / 'SupabaseClient.gd'
QUEUE_PATH = ROOT / 'scripts' / 'OfflineSyncQueue.gd'


class SupabaseIntegrationContractTest(unittest.TestCase):
    def test_example_config_has_required_fields(self):
        data = json.loads(CONFIG_PATH.read_text(encoding='utf-8'))
        required = {
            'project_url',
            'anon_key',
            'enable_sync',
            'offline_mode',
            'default_player_id',
            'sync_queue_storage',
        }
        self.assertTrue(required.issubset(data.keys()))

    def test_supabase_client_declares_expected_methods(self):
        client_text = CLIENT_PATH.read_text(encoding='utf-8')
        required = {
            'func configure',
            'func is_available',
            'func send_match_result',
            'func fetch_rankings',
            'func fetch_match_history',
            'func fetch_player_stats',
        }
        for expected in required:
            self.assertIn(expected, client_text)

    def test_queue_supports_offline_deduplication(self):
        queue_text = QUEUE_PATH.read_text(encoding='utf-8')
        for expected in ['request_id', 'match_id', 'dedupe_key', 'enqueue', 'save']:
            self.assertIn(expected, queue_text)


if __name__ == '__main__':
    unittest.main()
