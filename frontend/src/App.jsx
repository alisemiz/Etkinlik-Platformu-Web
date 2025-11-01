import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  Timestamp,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rawEtkinlikler, setRawEtkinlikler] = useState([]);
  const [rawKatilimlar, setRawKatilimlar] = useState([]);
  const [mergedEtkinlikler, setMergedEtkinlikler] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterView, setFilterView] = useState("all");
  const [yeniEtkinlikBaslik, setYeniEtkinlikBaslik] = useState("");
  const [yeniEtkinlikAciklama, setYeniEtkinlikAciklama] = useState("");
  const [yeniEtkinlikTarih, setYeniEtkinlikTarih] = useState("");
  const [editingEventId, setEditingEventId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    baslik: "",
    aciklama: "",
    tarih: "",
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user ? user : null);
      setIsLoading(false);
    });
    const etkinliklerCol = collection(db, "etkinlikler");
    const unsubscribeEtkinlikler = onSnapshot(etkinliklerCol, (snapshot) => {
      const etkinlikListesi = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRawEtkinlikler(etkinlikListesi);
    });
    const katilimlarCol = collection(db, "katilimlar");
    const unsubscribeKatilimlar = onSnapshot(katilimlarCol, (snapshot) => {
      const katilimListesi = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRawKatilimlar(katilimListesi);
    });
    return () => {
      unsubscribeAuth();
      unsubscribeEtkinlikler();
      unsubscribeKatilimlar();
    };
  }, []);

  useEffect(() => {
    const etkinlikListesi = rawEtkinlikler.map((etkinlik) => {
      const katilimcilar = rawKatilimlar.filter(
        (katilim) => katilim.etkinlik_id === etkinlik.id
      );
      return { ...etkinlik, katilimcilar: katilimcilar };
    });

    etkinlikListesi.sort((a, b) => {
      const timeA = a.olusturmaZamani ? a.olusturmaZamani.seconds : 0;
      const timeB = b.olusturmaZamani ? b.olusturmaZamani.seconds : 0;
      return timeB - timeA;
    });

    setMergedEtkinlikler(etkinlikListesi);
  }, [rawEtkinlikler, rawKatilimlar]);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage("Kayıt başarılı.");
    } catch (error) {
      setMessage(`Kayıt hatası: ${error.message}`);
    }
  };
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage("Giriş başarılı.");
    } catch (error) {
      setMessage(`Giriş hatası: ${error.message}`);
    }
  };
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMessage("Çıkış yapıldı.");
      setEmail("");
      setPassword("");
    } catch (error) {
      setMessage(`Çıkış hatası: ${error.message}`);
    }
  };
  const handleEtkinlikOlustur = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setMessage("Giriş yapmalısınız.");
      return;
    }
    setMessage("Oluşturuluyor...");
    try {
      await addDoc(collection(db, "etkinlikler"), {
        baslik: yeniEtkinlikBaslik,
        aciklama: yeniEtkinlikAciklama,
        tarih: new Date(yeniEtkinlikTarih),
        olusturanId: currentUser.uid,
        olusturanEmail: currentUser.email,
        olusturmaZamani: Timestamp.now(),
      });
      setMessage("Etkinlik başarıyla oluşturuldu!");
      setYeniEtkinlikBaslik("");
      setYeniEtkinlikAciklama("");
      setYeniEtkinlikTarih("");
    } catch (error) {
      setMessage(`Etkinlik oluşturma hatası: ${error.message}`);
    }
  };
  const handleKatil = async (etkinlikId) => {
    if (!currentUser) {
      setMessage("Katılmak için giriş yapmalısınız.");
      return;
    }
    setMessage("Katılım sağlanıyor...");
    try {
      await addDoc(collection(db, "katilimlar"), {
        etkinlik_id: etkinlikId,
        kullanici_id: currentUser.uid,
        kullanici_email: currentUser.email,
      });
      setMessage("Etkinliğe başarıyla katıldınız!");
    } catch (error) {
      setMessage(`Katılım hatası: ${error.message}`);
    }
  };
  const handleKatilmaktanVazgec = async (etkinlikId) => {
    if (!currentUser) {
      setMessage("Giriş yapmalısınız.");
      return;
    }
    setMessage("Ayrılınıyor...");
    try {
      const q = query(
        collection(db, "katilimlar"),
        where("etkinlik_id", "==", etkinlikId),
        where("kullanici_id", "==", currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setMessage("Katılım kaydı bulunamadı.");
        return;
      }
      const katilimDocId = querySnapshot.docs[0].id;
      await deleteDoc(doc(db, "katilimlar", katilimDocId));
      setMessage("Etkinlikten başarıyla ayrıldınız.");
    } catch (error) {
      setMessage(`Ayrılma hatası: ${error.message}`);
    }
  };
  const handleEtkinlikSil = async (etkinlikId) => {
    if (!currentUser) {
      setMessage("Giriş yapmalısınız.");
      return;
    }
    const eminMisin = window.confirm(
      "Bu etkinliği silmek istediğinize emin misiniz?"
    );
    if (!eminMisin) return;
    setMessage("Siliniyor...");
    try {
      const katilimSorgusu = query(
        collection(db, "katilimlar"),
        where("etkinlik_id", "==", etkinlikId)
      );
      const katilimSnapshot = await getDocs(katilimSorgusu);
      katilimSnapshot.forEach(async (katilimDoc) => {
        await deleteDoc(doc(db, "katilimlar", katilimDoc.id));
      });
      await deleteDoc(doc(db, "etkinlikler", etkinlikId));
      setMessage("Etkinlik başarıyla silindi.");
    } catch (error) {
      setMessage(`Silme hatası: ${error.message}`);
    }
  };
  const handleEditClick = (etkinlik) => {
    setEditingEventId(etkinlik.id);
    const isoTarih = new Date(etkinlik.tarih.seconds * 1000)
      .toISOString()
      .slice(0, 16);
    setEditFormData({
      baslik: etkinlik.baslik,
      aciklama: etkinlik.aciklama,
      tarih: isoTarih,
    });
  };
  const handleEditCancel = () => {
    setEditingEventId(null);
    setEditFormData({ baslik: "", aciklama: "", tarih: "" });
  };
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prevData) => ({ ...prevData, [name]: value }));
  };
  const handleEtkinlikGuncelle = async (e) => {
    e.preventDefault();
    if (!editingEventId) return;
    setMessage("Güncelleniyor...");
    try {
      const eventDocRef = doc(db, "etkinlikler", editingEventId);
      await updateDoc(eventDocRef, {
        baslik: editFormData.baslik,
        aciklama: editFormData.aciklama,
        tarih: new Date(editFormData.tarih),
      });
      setMessage("Etkinlik başarıyla güncellendi!");
      setEditingEventId(null);
      setEditFormData({ baslik: "", aciklama: "", tarih: "" });
    } catch (error) {
      setMessage(`Güncelleme hatası: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div
        className="app-container"
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <h2>Yükleniyor...</h2>
      </div>
    );
  }

  const eventsToDisplay = mergedEtkinlikler
    .filter((event) => {
      if (!currentUser && filterView !== "all") {
        return false;
      }
      if (filterView === "created") {
        return event.olusturanId === currentUser?.uid;
      }
      if (filterView === "joined") {
        return event.katilimcilar.some(
          (k) => k.kullanici_id === currentUser?.uid
        );
      }
      return true;
    })
    .filter((event) => {
      if (searchTerm === "") {
        return true;
      }
      return event.baslik.toLowerCase().includes(searchTerm.toLowerCase());
    });

  return (
    <div className="app-container">
      {/* --- SOL TARAF --- */}
      <div className="sol-panel">
        {currentUser ? (
          <div>
            <h1>Etkinlik Platformu</h1>
            <h2>Hoşgeldiniz, {currentUser.email}</h2>
            <button onClick={handleLogout} className="buton buton-danger">
              {/* YENİ: Çıkış İkonu */}
              <svg
                className="icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-2 0V4H5v12h7a1 1 0 010 2H4a1 1 0 01-1-1V3zm10 0a1 1 0 011 1v3a1 1 0 01-2 0V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M16 7a1 1 0 011 1v7a1 1 0 01-1 1h-3a1 1 0 110-2h2V8h-2a1 1 0 010-2h3z"
                  clipRule="evenodd"
                />
              </svg>
              Çıkış Yap
            </button>
            <hr />
            <h2>Yeni Etkinlik Oluştur</h2>
            <form onSubmit={handleEtkinlikOlustur} className="form-container">
              <div className="form-grup">
                <label className="form-label">Başlık</label>
                <input
                  type="text"
                  value={yeniEtkinlikBaslik}
                  onChange={(e) => setYeniEtkinlikBaslik(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-grup">
                <label className="form-label">Açıklama</label>
                <textarea
                  value={yeniEtkinlikAciklama}
                  onChange={(e) => setYeniEtkinlikAciklama(e.target.value)}
                  className="form-input"
                  rows="3"
                />
              </div>
              <div className="form-grup">
                <label className="form-label">Tarih</label>
                <input
                  type="datetime-local"
                  value={yeniEtkinlikTarih}
                  onChange={(e) => setYeniEtkinlikTarih(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              <button type="submit" className="buton buton-primary">
                {/* YENİ: Yayınla İkonu */}
                <svg
                  className="icon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                Etkinliği Yayınla
              </button>
            </form>
          </div>
        ) : (
          <div>
            <h1>Etkinlik Platformu</h1>
            <h2>Giriş Yap veya Kayıt Ol</h2>
            <form className="form-container">
              <div className="form-grup">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-grup">
                <label className="form-label">Şifre</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              <div className="buton-grup">
                <button
                  type="button"
                  onClick={handleLogin}
                  className="buton buton-secondary"
                >
                  Giriş Yap
                </button>
                <button
                  type="button"
                  onClick={handleRegister}
                  className="buton buton-primary"
                >
                  Kayıt Ol
                </button>
              </div>
            </form>
          </div>
        )}
        {message && <p className="mesaj-alani">{message}</p>}
      </div>

      {/* --- SAĞ TARAF: Tüm Etkinlikler Listesi --- */}
      <div className="sag-panel">
        <h2>Tüm Etkinlikler</h2>

        <div className="form-grup" style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="Etkinlik başlığına göre ara..."
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {currentUser && (
          <div
            className="buton-grup"
            style={{ justifyContent: "flex-start", marginBottom: "1.5rem" }}
          >
            <button
              className={`buton ${
                filterView === "all" ? "buton-primary" : "buton-secondary"
              }`}
              onClick={() => setFilterView("all")}
            >
              {/* YENİ: Tüm Etkinlikler İkonu */}
              <svg
                className="icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.243 3.03a1 1 0 01.077 1.258l-2.454 4.165A5 5 0 0010 10a5 5 0 003.134-1.547l-2.454-4.165a1 1 0 01.077-1.258A7 7 0 0110 3a7 7 0 01-1.757.03zM4.305 5.567a1 1 0 01.077 1.258L2.091 10.414a5 5 0 003.134 1.547l-2.454 4.165a1 1 0 01-.077 1.258A7 7 0 0110 17a7 7 0 015.695-1.993 1 1 0 01-.077-1.258l-2.454-4.165A5 5 0 0015 10a5 5 0 00-3.134-1.547l-2.454-4.165a1 1 0 01-.077-1.258A7 7 0 0110 3a7 7 0 01-5.695 2.567z"
                  clipRule="evenodd"
                />
              </svg>
              Tüm Etkinlikler
            </button>
            <button
              className={`buton ${
                filterView === "created" ? "buton-primary" : "buton-secondary"
              }`}
              onClick={() => setFilterView("created")}
            >
              {/* YENİ: Oluşturduklarım İkonu */}
              <svg
                className="icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
              Oluşturduklarım
            </button>
            <button
              className={`buton ${
                filterView === "joined" ? "buton-primary" : "buton-secondary"
              }`}
              onClick={() => setFilterView("joined")}
            >
              {/* YENİ: Katıldıklarım İkonu */}
              <svg
                className="icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M6.672 1.911a1 1 0 10-1.664 1.178l.254.364A12.028 12.028 0 003 9c0 5.514 4.486 10 10 10s10-4.486 10-10A12.028 12.028 0 0017.394 3.453l.254-.364a1 1 0 10-1.664-1.178 9.924 9.924 0 01-10.02 0zM12 9a2 2 0 100 4 2 2 0 000-4z"
                  clipRule="evenodd"
                />
              </svg>
              Katıldıklarım
            </button>
          </div>
        )}

        {eventsToDisplay.length === 0 ? (
          // YENİ: Boş durum mesajı
          <p className="empty-state-message">
            {searchTerm &&
              `"${searchTerm}" aramasına uygun etkinlik bulunamadı.`}
            {!searchTerm &&
              filterView === "all" &&
              `Henüz hiç etkinlik yayınlanmamış.`}
            {!searchTerm &&
              filterView === "created" &&
              `Henüz hiç etkinlik oluşturmadınız.`}
            {!searchTerm &&
              filterView === "joined" &&
              `Henüz hiçbir etkinliğe katılmadınız.`}
          </p>
        ) : (
          <div className="etkinlik-listesi">
            {eventsToDisplay.map((etkinlik) => {
              const kullaniciKatiliyor = currentUser
                ? etkinlik.katilimcilar.some(
                    (katilim) => katilim.kullanici_id === currentUser.uid
                  )
                : false;
              const kullaniciSahibi =
                currentUser && currentUser.uid === etkinlik.olusturanId;

              if (editingEventId === etkinlik.id) {
                return (
                  <div
                    key={etkinlik.id}
                    className="etkinlik-karti"
                    style={{ borderColor: "#2563eb", background: "#1e293b" }}
                  >
                    <h3>"{etkinlik.baslik}" Düzenleniyor...</h3>
                    <form
                      onSubmit={handleEtkinlikGuncelle}
                      className="form-container"
                      style={{ marginTop: "1rem" }}
                    >
                      <div className="form-grup">
                        <label className="form-label">Başlık</label>
                        <input
                          type="text"
                          name="baslik"
                          value={editFormData.baslik}
                          onChange={handleEditFormChange}
                          required
                          className="form-input"
                        />
                      </div>
                      <div className="form-grup">
                        <label className="form-label">Açıklama</label>
                        <textarea
                          name="aciklama"
                          value={editFormData.aciklama}
                          onChange={handleEditFormChange}
                          className="form-input"
                        />
                      </div>
                      <div className="form-grup">
                        <label className="form-label">Tarih</label>
                        <input
                          type="datetime-local"
                          name="tarih"
                          value={editFormData.tarih}
                          onChange={handleEditFormChange}
                          required
                          className="form-input"
                        />
                      </div>
                      <div className="buton-grup">
                        <button
                          type="button"
                          onClick={handleEditCancel}
                          className="buton buton-secondary"
                        >
                          İptal
                        </button>
                        <button type="submit" className="buton buton-success">
                          {/* YENİ: Kaydet İkonu */}
                          <svg
                            className="icon"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Kaydet
                        </button>
                      </div>
                    </form>
                  </div>
                );
              }

              return (
                <div key={etkinlik.id} className="etkinlik-karti">
                  <h3>{etkinlik.baslik}</h3>
                  <p>{etkinlik.aciklama}</p>
                  <div className="etkinlik-karti-meta">
                    <p>
                      <strong>Ne Zaman:</strong>{" "}
                      {etkinlik.tarih && etkinlik.tarih.seconds
                        ? new Date(
                            etkinlik.tarih.seconds * 1000
                          ).toLocaleString("tr-TR")
                        : "Belirtilmemiş"}
                    </p>
                    <p>
                      <strong>Kim Düzenliyor:</strong> {etkinlik.olusturanEmail}
                    </p>
                  </div>
                  <div>
                    <strong className="katilimcilar-baslik">
                      Katılımcılar ({etkinlik.katilimcilar.length}):
                    </strong>
                    {etkinlik.katilimcilar.length > 0 ? (
                      <ul className="katilimcilar-listesi">
                        {etkinlik.katilimcilar.map((katilim) => (
                          <li key={katilim.id}>{katilim.kullanici_email}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="katilimci-yok">İlk katılan siz olun!</p>
                    )}
                  </div>
                  {currentUser && (
                    <div className="buton-alani">
                      {!kullaniciSahibi &&
                        (kullaniciKatiliyor ? (
                          <button
                            className="buton buton-danger"
                            onClick={() => handleKatilmaktanVazgec(etkinlik.id)}
                          >
                            {/* YENİ: Vazgeç İkonu */}
                            <svg
                              className="icon"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Katılmaktan Vazgeç
                          </button>
                        ) : (
                          <button
                            className="buton buton-success"
                            onClick={() => handleKatil(etkinlik.id)}
                          >
                            {/* YENİ: Katıl İkonu */}
                            <svg
                              className="icon"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Hemen Katıl
                          </button>
                        ))}
                      {kullaniciSahibi && (
                        <>
                          <button
                            className="buton buton-primary"
                            onClick={() => handleEditClick(etkinlik)}
                          >
                            {/* YENİ: Güncelle İkonu */}
                            <svg
                              className="icon"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            Etkinliği Güncelle
                          </button>
                          <button
                            className="buton buton-warning"
                            onClick={() => handleEtkinlikSil(etkinlik.id)}
                          >
                            {/* YENİ: Sil İkonu */}
                            <svg
                              className="icon"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Etkinliği Sil
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
