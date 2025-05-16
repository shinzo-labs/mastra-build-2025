#!/bin/bash
set -e

source .env

# Reset database
dbmate up

# Update schema
dbmate dump

# Seed database
PGPASSWORD=$DB_PASSWORD psql -h localhost -U shinzo_app_user -d shinzo_app_db < db/seed.sql

if [ ! -d "backend/data" ]; then
  mkdir -p backend/data
fi

cat > backend/data/df3dee48-d309-4896-b947-ae376780579a.json << EOF
{"gridItems":{"dropdown1":{"id":"dropdown1","type":"dropdown","position":{"x":2,"y":3},"content":{"options":["ETH","BNB","USD"]}},"dropdown2":{"id":"dropdown2","type":"dropdown","position":{"x":3,"y":3},"content":{"options":["USD","BNB","ETH"]}},"textbox1":{"id":"textbox1","type":"textbox","position":{"x":2,"y":2},"content":{"placeholder":"Enter placeholder text..."}},"textbox2":{"id":"textbox2","type":"textbox","position":{"x":3,"y":2},"content":{"placeholder":"Enter placeholder text..."}},"button1":{"id":"button1","type":"button","position":{"x":4,"y":2},"content":{"text":"Execute","triggers":["uniswap_execute"]}},"dropdown3":{"id":"dropdown3","type":"dropdown","position":{"x":1,"y":3},"content":{"options":["Uniswap","Pancakeswap"]}}}}
EOF

cat > backend/data/6398f98a-9767-468f-a56e-897e3a23a968.json << EOF
{"gridItems":{"intVariable1":{"id":"intVariable1","type":"textbox","position":{"x":1,"y":1},"content":{"placeholder":"Enter Integer 1"}},"intVariable2":{"id":"intVariable2","type":"textbox","position":{"x":1,"y":2},"content":{"placeholder":"Enter Integer 2"}},"intVariable3":{"id":"intVariable3","type":"textbox","position":{"x":1,"y":3},"content":{"placeholder":"Enter Integer 3"}},"intVariable4":{"id":"intVariable4","type":"textbox","position":{"x":1,"y":4},"content":{"placeholder":"Enter Integer 4"}},"intVariable5":{"id":"intVariable5","type":"textbox","position":{"x":1,"y":5},"content":{"placeholder":"Enter Integer 5"}},"selectionVariable1":{"id":"selectionVariable1","type":"dropdown","position":{"x":2,"y":1},"content":{"options":["Option A","Option B","Option C"]}},"selectionVariable2":{"id":"selectionVariable2","type":"dropdown","position":{"x":2,"y":2},"content":{"options":["Choice 1","Choice 2","Choice 3"]}},"selectionVariable3":{"id":"selectionVariable3","type":"dropdown","position":{"x":2,"y":3},"content":{"options":["Select A","Select B","Select C"]}},"selectionVariable4":{"id":"selectionVariable4","type":"dropdown","position":{"x":2,"y":4},"content":{"options":["Type 1","Type 2","Type 3"]}},"selectionVariable5":{"id":"selectionVariable5","type":"dropdown","position":{"x":2,"y":5},"content":{"options":["Pick 1","Pick 2","Pick 3"]}},"configureButton":{"id":"configureButton","type":"button","position":{"x":3,"y":5},"content":{"text":"Configure","triggers":["contract_configure"]}}}}
EOF

cat > backend/data/e8361587-f5c9-41c1-be41-d74ab1b47e2f.json << EOF
{"gridItems":{"liquidityAmount":{"id":"liquidityAmount","type":"textbox","position":{"x":1,"y":1},"content":{"placeholder":"Enter Liquidity Amount"}},"liquidityToken":{"id":"liquidityToken","type":"dropdown","position":{"x":1,"y":2},"content":{"options":["ETH","DAI","USDC","WBTC","BNB"]}},"feeTier":{"id":"feeTier","type":"dropdown","position":{"x":1,"y":3},"content":{"options":["0.01%","0.05%","0.3%","1%"]}},"minLiquidity":{"id":"minLiquidity","type":"textbox","position":{"x":1,"y":4},"content":{"placeholder":"Enter Minimum Liquidity"}},"maxLiquidity":{"id":"maxLiquidity","type":"textbox","position":{"x":3,"y":1},"content":{"placeholder":"Enter Maximum Liquidity"}},"updateButton":{"id":"updateButton","type":"button","position":{"x":2,"y":5},"content":{"text":"Update Liquidity","triggers":["liquidity_update"]}},"dropdown1":{"id":"dropdown1","type":"dropdown","position":{"x":1,"y":5},"content":{"options":["Option 1","Option 2","Option 3"]}}}}
EOF

cat > backend/data/a6496865-1e44-42d2-a647-5fd94a53273d.json << EOF
{"gridItems": {}}
EOF

echo "Database reset complete"
