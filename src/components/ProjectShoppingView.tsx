'use client';

import { useState } from 'react';
import { Project, ShoppingItem, ALL_STORES } from '@/types';
import * as XLSX from 'xlsx-js-style';

interface ProjectShoppingViewProps {
  project: Project;
  selectedStore: string;
  printScope: 'current' | 'all';
  onAddItem: (projectId: string, item: Omit<ShoppingItem, 'id'>) => void;
  onUpdateItem: (projectId: string, itemId: string, updates: Partial<ShoppingItem>) => void;
  onDeleteItem: (projectId: string, itemId: string) => void;
}

export function ProjectShoppingView({ 
  project, selectedStore, printScope, onAddItem, onUpdateItem, onDeleteItem 
}: ProjectShoppingViewProps) {
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [newItem, setNewItem] = useState<Omit<ShoppingItem, 'id' | 'store' | 'isPurchased'>>({
    description: '',
    quantity: 1,
    pricePerBox: 0
  });

  const [editingCell, setEditingCell] = useState<{ itemId: string; field: keyof ShoppingItem } | null>(null);
  const [cellValue, setCellValue] = useState('');

  const handleAddItem = (store: string) => {
    if (!newItem.description.trim()) return;
    onAddItem(project.id, { ...newItem, store, isPurchased: false });
    setNewItem({ description: '', quantity: 1, pricePerBox: 0 });
    setAddingFor(null);
  };

  const startEdit = (item: ShoppingItem, field: keyof ShoppingItem) => {
    setEditingCell({ itemId: item.id, field });
    setCellValue(String((item as any)[field] || ''));
  };

  const commitEdit = (item: ShoppingItem) => {
    if (!editingCell) return;
    let val: any = cellValue;
    if (editingCell.field === 'pricePerBox' || editingCell.field === 'quantity') {
      val = parseFloat(cellValue) || 0;
    }
    onUpdateItem(project.id, item.id, { [editingCell.field]: val });
    setEditingCell(null);
  };

  const calculateTotal = (quantity: number, price: number) => {
    return (quantity * price);
  };

  const handleExcelExport = () => {
    const wb = XLSX.utils.book_new();
    const storesToExport = printScope === 'all' ? ALL_STORES : [selectedStore];

    storesToExport.forEach(store => {
      const items = (project.shoppingData || {})[store] || [];
      const rows = [
        [store, 'Lista de Compras'],
        ['Item / Descrição', 'Quantidade', 'Preço/Caixa (c/IVA)', 'Total'],
        ...items.map(i => [
          i.description, 
          i.quantity, 
          `${i.pricePerBox.toFixed(2)} €`, 
          `${calculateTotal(i.quantity, i.pricePerBox).toFixed(2)} €`
        ]),
        [],
        ['', '', 'TOTAL ENCOMENDA', `${items.reduce((acc, i) => acc + calculateTotal(i.quantity, i.pricePerBox), 0).toFixed(2)} €`]
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 40 }, { wch: 12 }, { wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, store.substring(0, 31));
    });
    XLSX.writeFile(wb, `Lista_Compras_${project.title}.xlsx`);
  };

  const displayStores = printScope === 'all' ? ALL_STORES : [selectedStore];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>🛒 Lista de Compras</h2>
          <button 
            onClick={() => setShowHidden(!showHidden)}
            style={{
              padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0',
              backgroundColor: showHidden ? 'var(--accent-dark)' : 'white',
              color: showHidden ? 'var(--primary-color)' : '#64748b',
              fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
            }}
          >
            {showHidden ? '👁️ Ver Ativos' : '🙈 Ver Ocultos'}
          </button>
        </div>
        <button onClick={handleExcelExport} style={excelBtn}>📊 Exportar Excel</button>
      </div>

      <div className="no-print" style={{ marginBottom: '0.5rem' }}>
        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
          {printScope === 'current' 
            ? `Lista de compras específica para ${selectedStore}.` 
            : 'Consolidado regional de compras de todas as unidades.'}
        </p>
      </div>

      {displayStores.map(store => {
        const rawItems = (project.shoppingData || {})[store] || [];
        const items = rawItems.filter(i => showHidden || !i.isHidden);
        const grandTotal = items.reduce((acc, i) => acc + calculateTotal(i.quantity, i.pricePerBox), 0);

        return (
          <div key={store} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#334155', color: 'white', padding: '0.75rem 1.25rem', fontWeight: 800, fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>📍 {store}</span>
              <span>Total: {grandTotal.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ ...th, width: '40px' }} className="no-print">OK</th>
                    <th style={{ ...th, textAlign: 'left' }}>Item / Descrição</th>
                    <th style={th}>Qtd.</th>
                    <th style={th}>Preço/Caixa</th>
                    <th style={th}>Total</th>
                    <th style={{ ...th, width: '100px' }} className="no-print">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const rowTotal = calculateTotal(item.quantity, item.pricePerBox);
                    return (
                      <tr key={item.id} style={{ 
                        background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', 
                        borderBottom: '1px solid #f1f5f9',
                        opacity: item.isHidden ? 0.4 : 1,
                        textDecoration: item.isPurchased ? 'line-through' : 'none',
                        color: item.isPurchased ? '#94a3b8' : 'inherit'
                      }}>
                        <td style={{ ...td, textAlign: 'center' }} className="no-print">
                          <input 
                            type="checkbox" 
                            checked={item.isPurchased} 
                            onChange={(e) => onUpdateItem(project.id, item.id, { isPurchased: e.target.checked })}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                        </td>
                        <td style={{ ...td, textAlign: 'left', fontWeight: 600 }} onClick={() => startEdit(item, 'description')}>
                          {editingCell?.itemId === item.id && editingCell.field === 'description'
                            ? <input value={cellValue} onChange={e => setCellValue(e.target.value)} onBlur={() => commitEdit(item)} autoFocus style={{ ...inlineInput, width: '100%' }} />
                            : item.description}
                        </td>
                        <td style={td} onClick={() => startEdit(item, 'quantity')}>
                           {editingCell?.itemId === item.id && editingCell.field === 'quantity'
                            ? <input type="number" value={cellValue} onChange={e => setCellValue(e.target.value)} onBlur={() => commitEdit(item)} autoFocus style={{ ...inlineInput, width: '60px' }} />
                            : item.quantity}
                        </td>
                        <td style={td} onClick={() => startEdit(item, 'pricePerBox')}>
                           {editingCell?.itemId === item.id && editingCell.field === 'pricePerBox'
                            ? <input type="number" step="0.01" value={cellValue} onChange={e => setCellValue(e.target.value)} onBlur={() => commitEdit(item)} autoFocus style={{ ...inlineInput, width: '80px' }} />
                            : `${item.pricePerBox.toFixed(2)} €`}
                        </td>
                        <td style={{ ...td, fontWeight: 700, color: item.isPurchased ? '#94a3b8' : '#0369a1' }}>
                           {rowTotal.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                        </td>
                        <td style={{ ...td, textAlign: 'center' }} className="no-print">
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button 
                               onClick={() => onUpdateItem(project.id, item.id, { isHidden: !item.isHidden })} 
                               style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.6 }}
                            >
                               {item.isHidden ? '👁️' : '🙈'}
                            </button>
                            <button 
                               onClick={() => { if(window.confirm(`Tem a certeza que deseja eliminar o item "${item.description}" da lista?`)) onDeleteItem(project.id, item.id); }} 
                               style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0.5 }}
                            >
                               ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Add Row */}
                  {addingFor === store ? (
                    <tr className="no-print" style={{ background: '#f0fdf4' }}>
                      <td></td>
                      <td style={td}>
                        <input 
                          placeholder="Descrição do item..." 
                          value={newItem.description} 
                          onChange={e => setNewItem(v => ({ ...v, description: e.target.value }))} 
                          onKeyDown={e => e.key === 'Enter' && handleAddItem(store)}
                          style={{ ...inlineInput, width: '100%' }} 
                        />
                      </td>
                      <td style={td}>
                        <input 
                          type="number" 
                          value={newItem.quantity} 
                          onChange={e => setNewItem(v => ({ ...v, quantity: parseInt(e.target.value) || 0 }))} 
                          style={{ ...inlineInput, width: '60px' }} 
                        />
                      </td>
                      <td style={td}>
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00"
                          value={newItem.pricePerBox || ''} 
                          onChange={e => setNewItem(v => ({ ...v, pricePerBox: parseFloat(e.target.value) || 0 }))} 
                          onKeyDown={e => e.key === 'Enter' && handleAddItem(store)}
                          style={{ ...inlineInput, width: '80px' }} 
                        />
                      </td>
                      <td style={td}>
                        {(newItem.quantity * (newItem.pricePerBox || 0)).toFixed(2)} €
                      </td>
                      <td style={{ ...td, display: 'flex', gap: '4px', justifyContent: 'center' }}>
                         <button onClick={() => handleAddItem(store)} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer' }}>✓</button>
                         <button onClick={() => setAddingFor(null)} style={{ background: '#94a3b8', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer' }}>✕</button>
                      </td>
                    </tr>
                  ) : (
                    <tr className="no-print">
                      <td colSpan={6} style={{ padding: '0.5rem' }}>
                         <button 
                           onClick={() => setAddingFor(store)}
                           style={{ width: '100%', background: 'none', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '0.5rem', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer' }}
                         >
                           + Adicionar Item à Lista
                         </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '1rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
               <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginRight: '1rem' }}>TOTAL ESTIMADO ({store}):</span>
               <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>
                  {grandTotal.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
               </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const excelBtn: React.CSSProperties = {
  background: '#f0fdf4', color: '#16a34a', border: '1px solid #16a34a',
  borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem'
};
const th: React.CSSProperties = {
  padding: '0.75rem', textAlign: 'center', fontWeight: 700,
  color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase'
};
const td: React.CSSProperties = {
  padding: '0.6rem 0.75rem', textAlign: 'center', verticalAlign: 'middle'
};
const inlineInput: React.CSSProperties = {
  padding: '0.2rem 0.4rem', border: '1px solid #3b82f6', borderRadius: '4px',
  fontSize: '0.75rem', outline: 'none'
};
