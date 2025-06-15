// CAP Table App with basic Card, Input, Button, and Table components included

import { useState, useEffect } from 'react';

// Simple UI Components
const Card = ({ children }) => <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>{children}</div>;
const CardContent = ({ children }) => <div>{children}</div>;
const Input = ({ ...props }) => <input {...props} style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }} />;
const Button = ({ children, ...props }) => <button {...props} style={{ padding: '8px 12px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{children}</button>;
const Table = ({ children }) => <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>{children}</table>;
const TableHeader = ({ children }) => <thead style={{ backgroundColor: '#f0f0f0' }}>{children}</thead>;
const TableBody = ({ children }) => <tbody>{children}</tbody>;
const TableRow = ({ children }) => <tr>{children}</tr>;
const TableCell = ({ children }) => <td style={{ padding: '8px', border: '1px solid #ddd' }}>{children}</td>;
const TableHead = ({ children }) => <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>{children}</th>;

import { PieChart, Pie, Cell, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import emailjs from '@emailjs/browser';
import { v4 as uuidv4 } from 'uuid';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#a0522d', '#7b68ee', '#20b2aa'];

export default function CapTable() {
  const [entries, setEntries] = useState([
    { id: uuidv4(), name: "Founder 1", role: "CEO", shares: 500000, investment: 0, shareClass: "Common", round: "Founders", vesting: "4yr/1yr cliff", dilutionProtection: "None", convertibles: "No", notes: "" }
  ]);

  const [submitted, setSubmitted] = useState(false);
  const [history, setHistory] = useState([]);
  const [compareIndex, setCompareIndex] = useState(null);
  const [filterRound, setFilterRound] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const handleChange = (id, field, value) => {
    setEntries(prev =>
      prev.map(entry =>
        entry.id === id ? { ...entry, [field]: field === 'shares' || field === 'investment' ? Number(value) : value } : entry
      )
    );
    setSubmitted(false);
  };

  const addEntry = () => {
    setEntries([
      ...entries,
      {
        id: uuidv4(),
        name: "",
        role: "",
        shares: 0,
        investment: 0,
        shareClass: "Common",
        round: "",
        vesting: "",
        dilutionProtection: "",
        convertibles: "",
        notes: ""
      }
    ]);
    setSubmitted(false);
  };

  const importEntries = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        const updatedData = importedData.map(item => ({ ...item, id: uuidv4() }));
        setEntries(updatedData);
        setSubmitted(false);
        alert("File imported successfully.");
      } catch (err) {
        alert("Invalid file format. Please upload a valid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const submitTable = () => {
    const valuation = calculatePostMoney();
    setHistory(prev => [...prev.slice(-9), {
      timestamp: new Date().toISOString(),
      entries: JSON.parse(JSON.stringify(entries)),
      valuation
    }]);
    setSubmitted(true);
  };

  const exportToPDF = () => {
    if (!clientEmail) {
      alert("Please enter your email address before downloading the report.");
      return;
    }

    const input = document.getElementById("cap-table-section");
    if (!input) return;
    html2canvas(input).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("CapTable.pdf");

      const form = {
        to_email: clientEmail,
        cc_email: "karandarjishack@gmail.com",
        message: "Attached is your Cap Table report. A copy has been sent to Karan for reference."
      };
      emailjs.send("your_service_id", "your_template_id", form, "your_user_id")
        .then(() => alert("Email sent successfully to " + clientEmail))
        .catch(err => alert("Email failed: " + err.text));
    });
  };

  const totalShares = entries.reduce((sum, e) => sum + e.shares, 0);
  const totalInvestment = entries.reduce((sum, e) => sum + e.investment, 0);
  const calculatePostMoney = () => totalInvestment > 0 ? (totalInvestment / (entries.find(e => e.round.toLowerCase().includes("series"))?.shares || 1)) * totalShares : 0;
  const postMoneyValuation = calculatePostMoney();
  const preMoneyValuation = postMoneyValuation - totalInvestment;

  const filteredEntries = entries.filter(e =>
    (!filterRound || e.round === filterRound) &&
    (!filterClass || e.shareClass === filterClass)
  );

  const chartData = submitted ? filteredEntries.map(e => ({ name: e.name || "Unnamed", value: e.shares })) : [];
  const valuationHistory = submitted ? history.map(h => ({ date: new Date(h.timestamp).toLocaleString(), valuation: h.valuation })) : [];

  return (
    <div id="cap-table-section" className="p-6">
      <h1 className="text-2xl font-bold mb-4">Editable CAP Table</h1>

      <div className="flex gap-4 mb-4">
        <Input placeholder="Filter by Round" value={filterRound} onChange={e => setFilterRound(e.target.value)} />
        <Input placeholder="Filter by Class" value={filterClass} onChange={e => setFilterClass(e.target.value)} />
        <Input placeholder="Enter your email to receive report" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
        <Button onClick={addEntry}>Add Entry</Button>
        <Button onClick={submitTable}>Submit Table</Button>
        <input type="file" accept=".json" onChange={importEntries} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Shares</TableHead>
            <TableHead>% Ownership</TableHead>
            <TableHead>Investment</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Round</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEntries.map(entry => (
            <TableRow key={entry.id}>
              <TableCell><Input value={entry.name} onChange={e => handleChange(entry.id, 'name', e.target.value)} /></TableCell>
              <TableCell><Input value={entry.role} onChange={e => handleChange(entry.id, 'role', e.target.value)} /></TableCell>
              <TableCell><Input type="number" value={entry.shares} onChange={e => handleChange(entry.id, 'shares', e.target.value)} /></TableCell>
              <TableCell>{((entry.shares / totalShares) * 100).toFixed(2)}%</TableCell>
              <TableCell><Input type="number" value={entry.investment} onChange={e => handleChange(entry.id, 'investment', e.target.value)} /></TableCell>
              <TableCell><Input value={entry.shareClass} onChange={e => handleChange(entry.id, 'shareClass', e.target.value)} /></TableCell>
              <TableCell><Input value={entry.round} onChange={e => handleChange(entry.id, 'round', e.target.value)} /></TableCell>
              <TableCell><Input value={entry.notes} onChange={e => handleChange(entry.id, 'notes', e.target.value)} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {submitted && (
        <>
          <div className="mt-6">
            <h2 className="text-xl font-semibold">Share Ownership Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold">Valuation Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={valuationHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="valuation" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6">
            <Button onClick={exportToPDF}>Export & Email PDF to Investor</Button>
          </div>
        </>
      )}
    </div>
  );
}
