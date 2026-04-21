import db, { initDb } from '../src/lib/db.ts';

const data = {
  "2026-04-01": {
    "Aveiro Norte": { "sales": 639.84, "transactions": 132 },
    "Aveiro Sul": { "sales": 458.86, "transactions": 109 },
    "Ovar Norte": { "sales": 88.18, "transactions": 39 },
    "Ovar Sul": { "sales": 196.19, "transactions": 65 },
    "Vagos Norte": { "sales": 1142.34, "transactions": 222 },
    "Vagos Sul": { "sales": 682.67, "transactions": 161 },
    "Vilar do Paraíso Norte": { "sales": 80.59, "transactions": 48 }
  },
  "2026-04-02": {
    "Aveiro Norte": { "sales": 926.12, "transactions": 191 },
    "Aveiro Sul": { "sales": 686.36, "transactions": 137 },
    "Ovar Norte": { "sales": 232.90, "transactions": 74 },
    "Ovar Sul": { "sales": 178.32, "transactions": 74 },
    "Vagos Norte": { "sales": 1914.97, "transactions": 350 },
    "Vagos Sul": { "sales": 904.85, "transactions": 166 },
    "Vilar do Paraíso Norte": { "sales": 67.54, "transactions": 44 }
  },
  "2026-04-03": {
    "Aveiro Norte": { "sales": 1071.21, "transactions": 185 },
    "Aveiro Sul": { "sales": 657.55, "transactions": 128 },
    "Ovar Norte": { "sales": 140.07, "transactions": 36 },
    "Ovar Sul": { "sales": 195.67, "transactions": 40 },
    "Vagos Norte": { "sales": 2041.47, "transactions": 316 },
    "Vagos Sul": { "sales": 838.76, "transactions": 193 },
    "Vilar do Paraíso Norte": { "sales": 15.69, "transactions": 8 }
  },
  "2026-04-04": {
    "Aveiro Norte": { "sales": 605.74, "transactions": 121 },
    "Aveiro Sul": { "sales": 508.08, "transactions": 115 },
    "Ovar Norte": { "sales": 166.30, "transactions": 53 },
    "Ovar Sul": { "sales": 148.67, "transactions": 53 },
    "Vagos Norte": { "sales": 954.73, "transactions": 189 },
    "Vagos Sul": { "sales": 588.57, "transactions": 163 },
    "Vilar do Paraíso Norte": { "sales": 55.37, "transactions": 21 }
  },
  "2026-04-05": {
    "Aveiro Norte": { "sales": 676.36, "transactions": 139 },
    "Aveiro Sul": { "sales": 870.45, "transactions": 188 },
    "Ovar Norte": { "sales": 128.01, "transactions": 42 },
    "Ovar Sul": { "sales": 216.54, "transactions": 59 },
    "Vagos Norte": { "sales": 1058.19, "transactions": 189 },
    "Vagos Sul": { "sales": 1136.98, "transactions": 251 },
    "Vilar do Paraíso Norte": { "sales": 41.62, "transactions": 19 }
  },
  "2026-04-06": {
    "Aveiro Norte": { "sales": 484.61, "transactions": 111 },
    "Aveiro Sul": { "sales": 755.90, "transactions": 181 },
    "Ovar Norte": { "sales": 69.93, "transactions": 37 },
    "Ovar Sul": { "sales": 174.63, "transactions": 57 },
    "Vagos Norte": { "sales": 818.59, "transactions": 191 },
    "Vagos Sul": { "sales": 811.83, "transactions": 188 },
    "Vilar do Paraíso Norte": { "sales": 49.81, "transactions": 30 }
  },
  "2026-04-07": {
    "Aveiro Norte": { "sales": 525.84, "transactions": 105 },
    "Aveiro Sul": { "sales": 516.77, "transactions": 107 },
    "Ovar Norte": { "sales": 136.78, "transactions": 60 },
    "Ovar Sul": { "sales": 128.05, "transactions": 61 },
    "Vagos Norte": { "sales": 615.70, "transactions": 144 },
    "Vagos Sul": { "sales": 584.36, "transactions": 140 },
    "Vilar do Paraíso Norte": { "sales": 74.46, "transactions": 50 }
  },
  "2026-04-08": {
    "Aveiro Norte": { "sales": 461.38, "transactions": 116 },
    "Aveiro Sul": { "sales": 502.11, "transactions": 120 },
    "Ovar Norte": { "sales": 182.27, "transactions": 57 },
    "Ovar Sul": { "sales": 120.69, "transactions": 57 },
    "Vagos Norte": { "sales": 757.68, "transactions": 163 },
    "Vagos Sul": { "sales": 591.20, "transactions": 143 },
    "Vilar do Paraíso Norte": { "sales": 66.73, "transactions": 35 }
  },
  "2026-04-09": {
    "Aveiro Norte": { "sales": 435.67, "transactions": 116 },
    "Aveiro Sul": { "sales": 468.27, "transactions": 122 },
    "Ovar Norte": { "sales": 119.52, "transactions": 54 },
    "Ovar Sul": { "sales": 206.53, "transactions": 72 },
    "Vagos Norte": { "sales": 735.62, "transactions": 172 },
    "Vagos Sul": { "sales": 447.62, "transactions": 111 },
    "Vilar do Paraíso Norte": { "sales": 63.20, "transactions": 40 }
  },
  "2026-04-10": {
    "Aveiro Norte": { "sales": 470.32, "transactions": 116 },
    "Aveiro Sul": { "sales": 474.64, "transactions": 113 },
    "Ovar Norte": { "sales": 133.53, "transactions": 57 },
    "Ovar Sul": { "sales": 140.72, "transactions": 57 },
    "Vagos Norte": { "sales": 869.93, "transactions": 169 },
    "Vagos Sul": { "sales": 578.90, "transactions": 125 },
    "Vilar do Paraíso Norte": { "sales": 65.42, "transactions": 40 }
  },
  "2026-04-11": {
    "Aveiro Norte": { "sales": 469.20, "transactions": 106 },
    "Aveiro Sul": { "sales": 421.36, "transactions": 94 },
    "Ovar Norte": { "sales": 108.82, "transactions": 28 },
    "Ovar Sul": { "sales": 126.39, "transactions": 43 },
    "Vagos Norte": { "sales": 636.94, "transactions": 135 },
    "Vagos Sul": { "sales": 442.51, "transactions": 110 },
    "Vilar do Paraíso Norte": { "sales": 42.08, "transactions": 14 }
  },
  "2026-04-12": {
    "Aveiro Norte": { "sales": 448.78, "transactions": 111 },
    "Aveiro Sul": { "sales": 412.77, "transactions": 92 },
    "Ovar Norte": { "sales": 61.66, "transactions": 29 },
    "Ovar Sul": { "sales": 96.90, "transactions": 42 },
    "Vagos Norte": { "sales": 613.61, "transactions": 139 },
    "Vagos Sul": { "sales": 462.19, "transactions": 99 },
    "Vilar do Paraíso Norte": { "sales": 16.17, "transactions": 10 }
  }
};

async function inject() {
  try {
    await initDb();
    console.log('Injetando dados de Abril na nuvem...');
    
    for (const [date, dayData] of Object.entries(data)) {
      const key = `sales_${date}`;
      const value = JSON.stringify(dayData);
      
      await db.execute({
        sql: 'INSERT OR REPLACE INTO SyncData (key, value, updatedAt) VALUES (?, ?, ?)',
        args: [key, value, Date.now()]
      });
      console.log(` - Injetado: ${key}`);
    }
    
    console.log('SUCESSO: Todos os dados de Abril foram injetados!');
  } catch (e) {
    console.error('Falha na injeção:', e);
  }
}

inject();
