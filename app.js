// ==================================================
// HABIT TRACKER CLI APP (Tahap 1–5)
// ==================================================
// Dibuat oleh: Irsan & ChatGPT (GPT-5)
// Bahasa: JavaScript (Node.js)
// ==================================================

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const DATA_FILE = path.join(__dirname, "habits-data.json");
const REMINDER_INTERVAL = 10000; // 10 detik

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ==================================================
// Tahap 2: Class UserProfile
// ==================================================
class UserProfile {
  constructor(name) {
    this.name = name ?? "Irsan Fadillah";
    this.joinedAt = new Date();
    this.stats = {
      totalHabits: 0,
      activeHabits: 0,
      completedHabits: 0,
      totalCompletions: 0,
    };
  }

  // Update statistik kebiasaan
  updateStats(habits = []) {
    const list = Array.isArray(habits) ? habits : [];
    this.stats.totalHabits = list.length;

    // Hitung total penyelesaian
    this.stats.totalCompletions = list
      .map((h) => Array.isArray(h.completions) ? h.completions.length : 0)
      .reduce((a, b) => a + b, 0);

    // Hitung jumlah kebiasaan selesai minggu ini
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const weekStart = new Date(today);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - diffToMonday);

    const isInThisWeek = (d) => {
      const date = new Date(d);
      return date >= weekStart && date <= today;
    };

    this.stats.completedHabits = list.filter((h) =>
      h.completions.some((c) => isInThisWeek(c))
    ).length;

    this.stats.activeHabits =
      this.stats.totalHabits - this.stats.completedHabits;

    return this.stats;
  }

  getDaysJoined() {
    const diffMs = new Date() - new Date(this.joinedAt);
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  toDisplayString() {
    const days = this.getDaysJoined();
    return (
      `User: ${this.name}\n` +
      `Bergabung: ${this.joinedAt.toDateString()} (${days} hari)\n` +
      `Total Kebiasaan: ${this.stats.totalHabits} | Aktif: ${this.stats.activeHabits} | ` +
      `Selesai Minggu Ini: ${this.stats.completedHabits}\n` +
      `Total Penyelesaian: ${this.stats.totalCompletions}`
    );
  }
}

// ==================================================
// Tahap 3: Class Habit
// ==================================================
class Habit {
  constructor(id, name, targetFrequency) {
    this.id = id;
    this.name = name;
    this.targetFrequency = targetFrequency;
    this.completions = [];
    this.createdAt = new Date();
  }

  markComplete() {
    const today = new Date().toDateString();
    const sudahAda = this.completions.find(
      (c) => new Date(c).toDateString() === today
    );
    if (!sudahAda) {
      this.completions.push(new Date().toISOString());
      console.log(`✅ "${this.name}" ditandai selesai hari ini.`);
    } else {
      console.log(`ℹ️ "${this.name}" sudah diselesaikan hari ini.`);
    }
  }

  getThisWeekCompletions() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const weekStart = new Date(today);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - diffToMonday);

    return this.completions.filter((c) => {
      const date = new Date(c);
      return date >= weekStart && date <= today;
    });
  }

  isCompletedThisWeek() {
    return this.getThisWeekCompletions().length >= this.targetFrequency;
  }

  getProgressPercentage() {
    const done = this.getThisWeekCompletions().length;
    const percent = Math.min((done / this.targetFrequency) * 100, 100);
    return Math.round(percent);
  }

  getStatus() {
    return this.isCompletedThisWeek() ? "[Selesai]" : "[Aktif]";
  }

  getProgressBar() {
    const percent = this.getProgressPercentage();
    const totalBars = 10;
    const filledBars = Math.round((percent / 100) * totalBars);
    return "█".repeat(filledBars) + "░".repeat(totalBars - filledBars) + ` ${percent}%`;
  }

  toDisplayString(index) {
    const done = this.getThisWeekCompletions().length;
    return `${index}. ${this.getStatus()} ${this.name}\n` +
           `   Target: ${this.targetFrequency}x/minggu\n` +
           `   Progress: ${done}/${this.targetFrequency} (${this.getProgressPercentage()}%)\n` +
           `   Progress Bar: ${this.getProgressBar()}`;
  }
}

// ==================================================
// Tahap 4: Class HabitTracker
// ==================================================
class HabitTracker {
  constructor(dataFile = DATA_FILE) {
    this.dataFile = dataFile;
    this.habits = [];
    this.userProfile = new UserProfile("Irsan Fadillah");
    this.loadFromFile();
    this.startReminder();
  }

  addHabit(name, freq) {
    const habit = new Habit(this.habits.length + 1, name, freq);
    this.habits.push(habit);
    console.log(`✅ Kebiasaan baru "${name}" ditambahkan.`);
    this.saveToFile();
  }

  completeHabit(index) {
    const h = this.habits[index - 1];
    if (!h) return console.log("❌ Tidak ditemukan!");
    h.markComplete();
    this.saveToFile();
  }

  deleteHabit(index) {
    const h = this.habits[index - 1];
    if (!h) return console.log("❌ Tidak ditemukan!");
    this.habits.splice(index - 1, 1);
    console.log(`🗑️ "${h.name}" dihapus.`);
    this.saveToFile();
  }

  displayProfile() {
    this.userProfile.updateStats(this.habits);
    console.log("==================================================");
    console.log("📊 PROFIL PENGGUNA");
    console.log("==================================================");
    console.log(this.userProfile.toDisplayString());
    console.log("==================================================");
  }

  displayHabits(filter = "all") {
    let list = this.habits;
    if (filter === "active") list = list.filter((h) => !h.isCompletedThisWeek());
    if (filter === "completed") list = list.filter((h) => h.isCompletedThisWeek());
    if (list.length === 0) return console.log("⚠️ Tidak ada kebiasaan.");

    list.forEach((h, i) => console.log(h.toDisplayString(i + 1) + "\n"));
  }

  saveToFile() {
    fs.writeFileSync(this.dataFile, JSON.stringify({ habits: this.habits, profile: this.userProfile }, null, 2));
  }

  loadFromFile() {
    if (!fs.existsSync(this.dataFile)) return;
    try {
      const data = JSON.parse(fs.readFileSync(this.dataFile, "utf-8"));
      this.habits = (data.habits || []).map((h) => Object.assign(new Habit(), h));
      this.userProfile = Object.assign(new UserProfile(), data.profile);
    } catch (e) {
      console.log("❌ Gagal memuat data.");
    }
  }

  startReminder() {
    setInterval(() => {
      const active = this.habits.filter((h) => !h.isCompletedThisWeek());
      if (active.length === 0) return;
      const random = active[Math.floor(Math.random() * active.length)];
      console.log("\n==================================================");
      console.log(`⏰ REMINDER: Jangan lupa "${random.name}"!`);
      console.log("==================================================\n");
    }, REMINDER_INTERVAL);
  }
}

// ==================================================
// Tahap 5: Menu Interaktif (CLI)
// ==================================================
const tracker = new HabitTracker();

function showMenu() {
  console.log(`
==================================================
HABIT TRACKER - MENU UTAMA
==================================================
1. Lihat Profil
2. Lihat Semua Kebiasaan
3. Lihat Kebiasaan Aktif
4. Lihat Kebiasaan Selesai
5. Tambah Kebiasaan Baru
6. Tandai Kebiasaan Selesai
7. Hapus Kebiasaan
8. Lihat Statistik
9. Demo Loop (while/for)
0. Keluar
==================================================`);
}

function askMenu() {
  showMenu();
  rl.question("Pilih menu: ", (input) => handleMenu(input.trim()));
}

function handleMenu(choice) {
  switch (choice) {
    case "1":
      tracker.displayProfile();
      break;
    case "2":
      tracker.displayHabits();
      break;
    case "3":
      tracker.displayHabits("active");
      break;
    case "4":
      tracker.displayHabits("completed");
      break;
    case "5":
      rl.question("Nama kebiasaan: ", (name) => {
        rl.question("Target per minggu: ", (t) => {
          tracker.addHabit(name, parseInt(t));
          askMenu();
        });
      });
      return;
    case "6":
      rl.question("Nomor kebiasaan: ", (n) => {
        tracker.completeHabit(parseInt(n));
        askMenu();
      });
      return;
    case "7":
      rl.question("Nomor kebiasaan: ", (n) => {
        tracker.deleteHabit(parseInt(n));
        askMenu();
      });
      return;
    case "8":
      tracker.displayProfile();
      break;
    case "9":
      console.log("Demo While Loop:");
      let i = 0;
      while (i < tracker.habits.length) console.log(tracker.habits[i++].toDisplayString(i));
      console.log("\nDemo For Loop:");
      for (let j = 0; j < tracker.habits.length; j++) console.log(tracker.habits[j].toDisplayString(j + 1));
      break;
    case "0":
      console.log("👋 Terima kasih telah menggunakan Habit Tracker!");
      rl.close();
      return;
    default:
      console.log("❌ Pilihan tidak valid!");
  }
  askMenu();
}

askMenu();
