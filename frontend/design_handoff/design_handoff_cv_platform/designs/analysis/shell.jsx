/* ============================================================
   Dashboard shell — Sidebar + Mobile bar
   ============================================================ */

function Sidebar({ theme, setTheme }) {
  const items = [
    { icon: <Icon.Home className="sidebar__icon" />,      label: "Panel",         href: "#" },
    { icon: <Icon.FileText className="sidebar__icon" />,  label: "CV'm",          href: "#" },
    { icon: <Icon.Brain className="sidebar__icon" />,     label: "AI Analiz",     href: "#", active: true, badge: "AI" },
    { icon: <Icon.Briefcase className="sidebar__icon" />, label: "İlanlar",       href: "#" },
    { icon: <Icon.Inbox className="sidebar__icon" />,     label: "Başvurularım",  href: "#", count: 8 },
    { icon: <Icon.Message className="sidebar__icon" />,   label: "Mesajlar",      href: "#", count: 3 },
  ];
  const account = [
    { icon: <Icon.User className="sidebar__icon" />,   label: "Profil",     href: "#" },
    { icon: <Icon.Crown className="sidebar__icon" />,  label: "Abonelik",   href: "#" },
  ];

  const renderItem = (it, i) => (
    <a
      key={i}
      href={it.href}
      className={`sidebar__item ${it.active ? "sidebar__item--active" : ""}`}
    >
      {it.icon}
      <span>{it.label}</span>
      {it.badge && <span className="sidebar__badge sidebar__badge--ai">{it.badge}</span>}
      {it.count != null && <span className="sidebar__badge">{it.count}</span>}
    </a>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark"><Icon.Logo /></span>
        Synapse
      </div>

      <div className="sidebar__section">Çalışma alanı</div>
      <nav className="sidebar__nav">{items.map(renderItem)}</nav>

      <div className="sidebar__section">Hesap</div>
      <nav className="sidebar__nav">{account.map(renderItem)}</nav>

      <div className="sidebar__footer">
        <div className="row" style={{ marginBottom: 10, paddingLeft: 6 }}>
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <span className="mono-sm">{theme === "dark" ? "Karanlık" : "Aydınlık"}</span>
        </div>
        <div className="sidebar__user">
          <div className="sidebar__avatar">AY</div>
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">A. K. Yılmaz</div>
            <div className="sidebar__user-plan">FREE · 1/3 kullanım</div>
          </div>
          <Icon.Chevron className="sidebar__icon" style={{ color: "var(--text-muted)" }} />
        </div>
      </div>
    </aside>
  );
}

function MobileBar({ theme, setTheme }) {
  return (
    <div className="mobile-bar">
      <div className="sidebar__brand" style={{ margin: 0 }}>
        <span className="sidebar__brand-mark"><Icon.Logo /></span>
        Synapse
      </div>
      <div className="row">
        <ThemeToggle theme={theme} setTheme={setTheme} />
        <button className="icon-btn"><Icon.Menu width="18" height="18" /></button>
      </div>
    </div>
  );
}

window.Sidebar = Sidebar;
window.MobileBar = MobileBar;
