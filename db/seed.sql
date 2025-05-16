TRUNCATE main.user, main.dashboard, main.user_stars, main.execution CASCADE;

INSERT INTO main.user (uuid, wallet_address, login_message, login_signature) VALUES
    ('7c37b4a5-9f9d-4e48-9ecb-7d56d8a3f33c', '0xa1239105d17515f332156cc7d9fefa907cbf5edc', 'Logging into Shinzo: 0xa1239105d17515f332156cc7d9fefa907cbf5edc', '0x58f97a3284a50811a02dd30a391376d9020e1cc6027efe418f656b355127d1592f4f2721cb8658825951a34e00afae8311b75a526b9866b1c58d00fd8552c1421b'),
    ('b49d25c4-7c42-4a5b-9f3e-8d56a2b1c90d', '0x2345678901234567890123456789012345678901', 'Login message 2', '0x2345...'),
    ('1483d189-c0ad-4a6e-bd92-1938bcabf127', '0x3456789012345678901234567890123456789012', 'Login message 3', '0x3456...'),
    ('d3be3f4b-357d-4b79-9e5b-5daed24d4519', '0x4567890123456789012345678901234567890123', 'Login message 4', '0x4567...'),
    ('dfc79943-f57d-42b7-b124-59a9f0fb232a', '0x5678901234567890123456789012345678901234', 'Login message 5', '0x5678...');

INSERT INTO main.dashboard (uuid, owner_uuid, name, visibility, stars_count, execution_count) VALUES
    ('df3dee48-d309-4896-b947-ae376780579a', '7c37b4a5-9f9d-4e48-9ecb-7d56d8a3f33c', 'Uniswap Trading Panel', 'public', 5, 2),
    ('6398f98a-9767-468f-a56e-897e3a23a968', '7c37b4a5-9f9d-4e48-9ecb-7d56d8a3f33c', 'Private Empty Dashboard', 'private', 0, 0),
    ('a6496865-1e44-42d2-a647-5fd94a53273d', 'b49d25c4-7c42-4a5b-9f3e-8d56a2b1c90d', 'Public Empty Panel', 'public', 3, 0),
    ('e8361587-f5c9-41c1-be41-d74ab1b47e2f', '7c37b4a5-9f9d-4e48-9ecb-7d56d8a3f33c', 'Liquidity Pool Management', 'public', 0, 0);

INSERT INTO main.user_stars (user_uuid, dashboard_uuid) VALUES
    ('7c37b4a5-9f9d-4e48-9ecb-7d56d8a3f33c', 'df3dee48-d309-4896-b947-ae376780579a'),
    ('7c37b4a5-9f9d-4e48-9ecb-7d56d8a3f33c', 'a6496865-1e44-42d2-a647-5fd94a53273d'),
    ('b49d25c4-7c42-4a5b-9f3e-8d56a2b1c90d', 'df3dee48-d309-4896-b947-ae376780579a'),
    ('b49d25c4-7c42-4a5b-9f3e-8d56a2b1c90d', 'a6496865-1e44-42d2-a647-5fd94a53273d'),
    ('1483d189-c0ad-4a6e-bd92-1938bcabf127', 'df3dee48-d309-4896-b947-ae376780579a'),
    ('1483d189-c0ad-4a6e-bd92-1938bcabf127', 'a6496865-1e44-42d2-a647-5fd94a53273d'),
    ('d3be3f4b-357d-4b79-9e5b-5daed24d4519', 'df3dee48-d309-4896-b947-ae376780579a'),
    ('dfc79943-f57d-42b7-b124-59a9f0fb232a', 'df3dee48-d309-4896-b947-ae376780579a');

INSERT INTO main.execution (user_uuid, dashboard_uuid, blockchain, signed_data_payload, gas_used, status) VALUES
    ('7c37b4a5-9f9d-4e48-9ecb-7d56d8a3f33c', 'df3dee48-d309-4896-b947-ae376780579a', 'ethereum', '{"method": "eth_call"}', 21000, 'completed'),
    ('b49d25c4-7c42-4a5b-9f3e-8d56a2b1c90d', 'df3dee48-d309-4896-b947-ae376780579a', 'polygon', '{"method": "eth_getBalance"}', 15000, 'completed');
