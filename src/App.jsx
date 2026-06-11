import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const formatRupiah = (num) => {
  if (isNaN(num) || num === null) return 'Rp 0'
  return 'Rp ' + Math.round(num).toLocaleString('id-ID')
}

const parseNum = (val) => {
  const cleaned = String(val).replace(/[^0-9]/g, '')
  return parseInt(cleaned, 10) || 0
}

const RupiahInput = ({ value, onChange, placeholder, disabled }) => {
  const display = value ? parseNum(value).toLocaleString('id-ID') : ''
  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      placeholder={placeholder || '0'}
      disabled={disabled}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9]/g, '')
        onChange(raw)
      }}
      className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white'}`}
    />
  )
}

const verdictStyle = {
  green: { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-700', badge: 'bg-green-500' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-800', badge: 'bg-yellow-500' },
  red: { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-700', badge: 'bg-red-500' },
}

export default function App() {
  const [gaji, setGaji] = useState('')
  const [cicilanLama, setCicilanLama] = useState([])
  const [useTotal, setUseTotal] = useState(false)
  const [pokok, setPokok] = useState('')
  const [bunga, setBunga] = useState('')
  const [totalLangsung, setTotalLangsung] = useState('')
  const [tenor, setTenor] = useState('')
  const [tenorUnit, setTenorUnit] = useState('tahun')
  const [hasil, setHasil] = useState(null)
  const [error, setError] = useState('')

  const tambahCicilanLama = () => {
    setCicilanLama([...cicilanLama, { label: '', amount: '' }])
  }

  const updateCicilanLama = (i, field, val) => {
    const updated = [...cicilanLama]
    updated[i] = { ...updated[i], [field]: val }
    setCicilanLama(updated)
  }

  const hapusCicilanLama = (i) => {
    setCicilanLama(cicilanLama.filter((_, idx) => idx !== i))
  }

  const hitung = () => {
    setError('')
    const G = parseNum(gaji)
    if (!G || G <= 0) { setError('Masukkan gaji pokok bulanan.'); return }

    const cicilanBaruPerBulan = useTotal
      ? parseNum(totalLangsung)
      : parseNum(pokok) + parseNum(bunga)

    if (!cicilanBaruPerBulan || cicilanBaruPerBulan <= 0) {
      setError('Masukkan jumlah cicilan baru.'); return
    }

    const tenorVal = parseInt(tenor, 10)
    if (!tenorVal || tenorVal <= 0) { setError('Masukkan tenor pinjaman.'); return }

    const T_bulan = tenorUnit === 'tahun' ? tenorVal * 12 : tenorVal
    const T_tahun = T_bulan / 12

    const totalCicilanLama = cicilanLama.reduce((sum, c) => sum + parseNum(c.amount), 0)
    const totalCicilan = cicilanBaruPerBulan + totalCicilanLama
    const rasio = (totalCicilan / G) * 100
    const sisa = G - totalCicilan

    let status, warna, pesan
    if (rasio <= 10) {
      status = 'AMAN'
      warna = 'green'
      pesan = 'Rasio cicilan kamu masih dalam batas aman (≤10%). Tetap disiplin dan prioritaskan melunasi lebih cepat bila ada rezeki lebih.'
    } else if (rasio <= 15) {
      status = 'HATI-HATI'
      warna = 'yellow'
      pesan = 'Cicilan ini berada di batas toleransi (10–15%). Pertimbangkan matang-matang apakah benar-benar perlu, dan pastikan tidak ada pengeluaran tak terduga yang bisa mengganggu.'
    } else {
      status = 'BERBAHAYA'
      warna = 'red'
      pesan = 'Cicilan ini terlalu berat (>15% dari gaji pokok). Sangat tidak disarankan untuk diambil. Cari alternatif atau kurangi nilai pinjaman.'
    }

    const proyeksi = []
    if (tenorUnit === 'bulan') {
      for (let m = 0; m <= T_bulan; m++) {
        const dayaBeli = sisa / Math.pow(1.1, m / 12)
        proyeksi.push({
          label: `Bln ${m}`,
          'Sisa Nominal': Math.round(sisa),
          'Daya Beli Riil': Math.round(dayaBeli),
          penurunan: m === 0 ? 0 : (1 - 1 / Math.pow(1.1, m / 12)) * 100
        })
      }
    } else {
      for (let y = 0; y <= T_tahun; y++) {
        const dayaBeli = sisa / Math.pow(1.1, y)
        proyeksi.push({
          label: `Thn ${y}`,
          'Sisa Nominal': Math.round(sisa),
          'Daya Beli Riil': Math.round(dayaBeli),
          penurunan: y === 0 ? 0 : (1 - 1 / Math.pow(1.1, y)) * 100
        })
      }
    }

    const totalDibayar = cicilanBaruPerBulan * T_bulan
    const totalPokok = !useTotal ? parseNum(pokok) * T_bulan : null
    const totalBunga = !useTotal ? parseNum(bunga) * T_bulan : null

    setHasil({ G, totalCicilan, cicilanBaruPerBulan, rasio, sisa, status, warna, pesan, proyeksi, totalDibayar, totalPokok, totalBunga, T_bulan, T_tahun, tenorVal, tenorUnit })
    setTimeout(() => {
      document.getElementById('hasil-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-slate-800 text-white py-6 px-4 text-center shadow-md">
        <h1 className="text-2xl font-bold tracking-tight">Kalkulator Cicilan Aman</h1>
        <p className="text-slate-300 text-sm mt-1">Pikir dua kali sebelum berhutang.</p>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">

          {/* Gaji Pokok */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Gaji Pokok Bulanan <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-2">Tanpa tunjangan — hanya gaji bersih yang rutin kamu terima.</p>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm text-slate-400 pointer-events-none">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={gaji ? parseNum(gaji).toLocaleString('id-ID') : ''}
                placeholder="5.000.000"
                onChange={(e) => setGaji(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Cicilan Lama */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Cicilan yang Sedang Berjalan</label>
                <p className="text-xs text-slate-500">Cicilan lain yang sudah kamu tanggung saat ini (opsional).</p>
              </div>
              <button
                onClick={tambahCicilanLama}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-300 transition whitespace-nowrap"
              >
                + Tambah
              </button>
            </div>
            {cicilanLama.length > 0 && (
              <div className="space-y-2 mt-2">
                {cicilanLama.map((c, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Nama cicilan (misal: motor)"
                      value={c.label}
                      onChange={(e) => updateCicilanLama(i, 'label', e.target.value)}
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="w-36">
                      <RupiahInput
                        value={c.amount}
                        onChange={(v) => updateCicilanLama(i, 'amount', v)}
                        placeholder="500.000"
                      />
                    </div>
                    <button
                      onClick={() => hapusCicilanLama(i)}
                      className="text-slate-400 hover:text-red-500 transition text-xl leading-none px-1"
                      title="Hapus"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cicilan Baru */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Cicilan Baru yang Ingin Diambil <span className="text-red-500">*</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 mb-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useTotal}
                onChange={(e) => {
                  setUseTotal(e.target.checked)
                  setPokok('')
                  setBunga('')
                  setTotalLangsung('')
                }}
                className="rounded accent-blue-600"
              />
              Sudah tahu total cicilan per bulan (sudah termasuk bunga)
            </label>

            {useTotal ? (
              <div>
                <p className="text-xs text-slate-500 mb-1">Total cicilan/bulan dari pinjol / leasing</p>
                <RupiahInput value={totalLangsung} onChange={setTotalLangsung} placeholder="1.200.000" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Pokok cicilan / bulan</p>
                  <RupiahInput value={pokok} onChange={setPokok} placeholder="1.000.000" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Bunga cicilan / bulan</p>
                  <RupiahInput value={bunga} onChange={setBunga} placeholder="150.000" />
                </div>
              </div>
            )}
          </div>

          {/* Tenor */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Tenor <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={tenorUnit === 'tahun' ? 30 : 360}
                value={tenor}
                onChange={(e) => setTenor(e.target.value)}
                placeholder={tenorUnit === 'tahun' ? '3' : '12'}
                className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={tenorUnit}
                onChange={(e) => { setTenorUnit(e.target.value); setTenor('') }}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="tahun">Tahun</option>
                <option value="bulan">Bulan</option>
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <button
            onClick={hitung}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-lg transition text-sm tracking-wide"
          >
            Hitung Sekarang
          </button>
        </div>

        {/* Hasil */}
        {hasil && (
          <div id="hasil-section" className="space-y-5">
            {/* Verdict */}
            {(() => {
              const s = verdictStyle[hasil.warna]
              return (
                <div className={`rounded-xl border-2 ${s.border} ${s.bg} p-5`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`${s.badge} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                      {hasil.status}
                    </span>
                    <span className={`text-xl font-bold ${s.text}`}>
                      {hasil.rasio.toFixed(1)}% dari gaji pokok
                    </span>
                  </div>
                  <p className={`text-sm ${s.text}`}>{hasil.pesan}</p>
                </div>
              )
            })()}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Gaji Pokok', value: formatRupiah(hasil.G) },
                { label: 'Total Cicilan/bln', value: formatRupiah(hasil.totalCicilan) },
                { label: 'Sisa Uang/bln', value: formatRupiah(hasil.sisa) },
                { label: 'Rasio Cicilan', value: `${hasil.rasio.toFixed(1)}%` },
              ].map((item) => (
                <div key={item.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Ringkasan Pinjaman */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Ringkasan Total Pinjaman Baru</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total dibayarkan selama {hasil.tenorVal} {hasil.tenorUnit}</span>
                  <span className="font-semibold text-slate-800">{formatRupiah(hasil.totalDibayar)}</span>
                </div>
                {hasil.totalPokok !== null && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">– Total pokok</span>
                      <span className="text-slate-700">{formatRupiah(hasil.totalPokok)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">– Total bunga</span>
                      <span className="text-orange-600 font-medium">{formatRupiah(hasil.totalBunga)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bonus Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 text-sm text-blue-700">
              Jika mendapat bonus atau rezeki lebih, prioritaskan untuk melunasi hutang lebih cepat agar beban berkurang dan kamu bebas lebih awal.
            </div>

            {/* Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-1">
                Proyeksi Daya Beli Sisa Uang per {hasil.tenorUnit === 'bulan' ? 'Bulan' : 'Tahun'}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Gaji dan cicilan nominal tidak berubah — tapi daya beli sisa uangmu turun 10% setiap tahun karena inflasi. Makin lama tenornya, makin terasa.
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={hasil.proyeksi} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : `${(v / 1000).toFixed(0)}rb`}
                    tick={{ fontSize: 10 }}
                    width={45}
                  />
                  <Tooltip formatter={(v, name) => [formatRupiah(v), name]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Sisa Nominal" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Daya Beli Riil" fill="#f97316" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm overflow-x-auto">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Tabel Proyeksi per {hasil.tenorUnit === 'bulan' ? 'Bulan' : 'Tahun'}
              </h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <th className="text-left px-3 py-2 font-semibold rounded-tl-lg">{hasil.tenorUnit === 'bulan' ? 'Bulan' : 'Tahun'}</th>
                    <th className="text-right px-3 py-2 font-semibold">Sisa Nominal/bln</th>
                    <th className="text-right px-3 py-2 font-semibold">Daya Beli Riil/bln</th>
                    <th className="text-right px-3 py-2 font-semibold rounded-tr-lg">Penurunan</th>
                  </tr>
                </thead>
                <tbody>
                  {hasil.proyeksi.map((row, i) => {
                    const isWarning = row['Daya Beli Riil'] < hasil.sisa * 0.5
                    return (
                      <tr
                        key={i}
                        className={`border-t border-slate-100 ${isWarning ? 'bg-red-50' : i % 2 === 0 ? '' : 'bg-slate-50/40'}`}
                      >
                        <td className="px-3 py-2 font-medium text-slate-700">{row.label}</td>
                        <td className="px-3 py-2 text-right text-slate-600">{formatRupiah(row['Sisa Nominal'])}</td>
                        <td className={`px-3 py-2 text-right font-medium ${isWarning ? 'text-red-600' : 'text-orange-600'}`}>
                          {formatRupiah(row['Daya Beli Riil'])}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-500">
                          {row.penurunan === 0 ? '—' : `-${row.penurunan.toFixed(1)}%`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <p className="text-xs text-red-400 mt-2">Baris merah = daya beli riil sudah turun lebih dari 50% dari nilai awal.</p>
            </div>

            <p className="text-xs text-slate-400 text-center pb-4">
              Kalkulator ini mengasumsikan gaji tetap dan penurunan daya beli 10% per tahun. Angka ini adalah estimasi untuk membantu pengambilan keputusan, bukan jaminan finansial.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
