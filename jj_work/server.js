const express=require("express");
const path=require("path");
const Database=require("better-sqlite3");
const QRCode=require("qrcode");

const app=express();
const PORT=process.env.PORT||3000;
const ADMIN_USER=process.env.ADMIN_USER||"admin";
const ADMIN_PASS=process.env.ADMIN_PASS||"jjservice";

const db=new Database(path.join(__dirname,"jjservice.db"));
db.pragma("journal_mode=WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS tickets(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 ticket_no TEXT UNIQUE NOT NULL,
 name TEXT NOT NULL,
 phone TEXT NOT NULL,
 device TEXT NOT NULL,
 issue TEXT NOT NULL,
 cost TEXT DEFAULT '',
 status TEXT NOT NULL DEFAULT 'received',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS reservations(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 phone TEXT NOT NULL,
 date TEXT NOT NULL,
 time TEXT NOT NULL,
 device TEXT NOT NULL,
 issue TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);`);

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));

function auth(req,res,next){
 const h=req.headers.authorization||"";
 if(!h.startsWith("Basic ")) return res.status(401).set("WWW-Authenticate",'Basic realm="JJ SERVICE Admin"').send("Login admin diperlukan.");
 const decoded=Buffer.from(h.slice(6),"base64").toString();
 const [u,p]=decoded.split(":");
 if(u!==ADMIN_USER||p!==ADMIN_PASS) return res.status(401).set("WWW-Authenticate",'Basic realm="JJ SERVICE Admin"').send("Username/password salah.");
 next();
}
function ticketNo(){
 const d=new Date();
 const y=String(d.getFullYear()).slice(-2),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");
 const n=(db.prepare("SELECT COUNT(*) c FROM tickets WHERE date(created_at)=date('now','localtime')").get().c||0)+1;
 return `JJ-${y}${m}${day}-${String(n).padStart(3,"0")}`;
}
const statuses={
 received:"HP Diterima",
 checking:"Sedang Diperiksa",
 waiting:"Menunggu Sparepart / Persetujuan",
 repairing:"Sedang Dikerjakan",
 done:"Sudah Selesai",
 picked:"Sudah Diambil"
};

app.get("/api/public/ticket/:no",(req,res)=>{
 const t=db.prepare("SELECT ticket_no,name,device,issue,status,cost,created_at,updated_at FROM tickets WHERE ticket_no=?").get(req.params.no);
 if(!t)return res.status(404).json({error:"Tiket tidak ditemukan"});
 t.status_label=statuses[t.status]||t.status;
 res.json(t);
});

app.get("/api/admin/tickets",auth,(req,res)=>{
 const rows=db.prepare("SELECT * FROM tickets ORDER BY id DESC").all();
 rows.forEach(x=>x.status_label=statuses[x.status]||x.status);
 res.json(rows);
});
app.post("/api/admin/tickets",auth,(req,res)=>{
 const {name,phone,device,issue,cost,status="received"}=req.body;
 if(!name||!phone||!device||!issue)return res.status(400).json({error:"Data wajib belum lengkap"});
 const no=ticketNo();
 db.prepare("INSERT INTO tickets(ticket_no,name,phone,device,issue,cost,status) VALUES(?,?,?,?,?,?,?)")
 .run(no,name,phone,device,issue,cost||"",status);
 res.json({ticket_no:no});
});
app.patch("/api/admin/tickets/:no",auth,(req,res)=>{
 const {status,cost}=req.body;
 db.prepare("UPDATE tickets SET status=COALESCE(?,status),cost=COALESCE(?,cost),updated_at=CURRENT_TIMESTAMP WHERE ticket_no=?")
 .run(status??null,cost??null,req.params.no);
 res.json({ok:true});
});
app.delete("/api/admin/tickets/:no",auth,(req,res)=>{
 db.prepare("DELETE FROM tickets WHERE ticket_no=?").run(req.params.no);
 res.json({ok:true});
});
app.get("/api/admin/stats",auth,(req,res)=>{
 const total=db.prepare("SELECT COUNT(*) c FROM tickets").get().c;
 const work=db.prepare("SELECT COUNT(*) c FROM tickets WHERE status IN ('checking','waiting','repairing')").get().c;
 const done=db.prepare("SELECT COUNT(*) c FROM tickets WHERE status='done'").get().c;
 res.json({total,work,done});
});
app.post("/api/reservations",(req,res)=>{
 const {name,phone,date,time,device,issue}=req.body;
 if(!name||!phone||!date||!time||!device||!issue)return res.status(400).json({error:"Data reservasi belum lengkap"});
 db.prepare("INSERT INTO reservations(name,phone,date,time,device,issue) VALUES(?,?,?,?,?,?)").run(name,phone,date,time,device,issue);
 res.json({ok:true});
});
app.get("/api/admin/reservations",auth,(req,res)=>{
 res.json(db.prepare("SELECT * FROM reservations ORDER BY id DESC").all());
});
app.get("/api/qr/:no",async(req,res)=>{
 const t=db.prepare("SELECT ticket_no FROM tickets WHERE ticket_no=?").get(req.params.no);
 if(!t)return res.status(404).send("Tiket tidak ditemukan");
 const base=`${req.protocol}://${req.get("host")}/cek.html?ticket=${encodeURIComponent(t.ticket_no)}`;
 const png=await QRCode.toBuffer(base,{width:700,margin:2});
 res.type("png").send(png);
});

app.get("/api/config",(req,res)=>res.json({shop:"JJ SERVICE",whatsapp:"6289675599832",address:"Jl. Nusantara Raya, Perumnas 3, Aren Jaya, Bekasi Timur"}));

app.listen(PORT,()=>console.log(`JJ SERVICE aktif: http://localhost:${PORT}`));
