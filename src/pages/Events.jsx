import React from 'react';

export default function Events() {
    return (
        <div className="collection-page" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '70vh',
            textAlign: 'center'
        }}>
            <div style={{
                fontSize: '5rem',
                marginBottom: '20px',
                animation: 'float 3s ease-in-out infinite'
            }}>
                📅
            </div>
            <h2 className="section-title" style={{ fontSize: '2rem', marginBottom: '16px' }}>
                Etkinlikler Çok Yakında!
            </h2>
            <p style={{
                color: 'var(--text-secondary)',
                maxWidth: '500px',
                lineHeight: '1.6',
                fontSize: '1.1rem'
            }}>
                Arkadaşlarınla ortak etkinlikler planlayabileceğin, buluşmalar organize edebileceğin
                bu bölüm şu an yapım aşamasında.
                <br /><br />
                <span style={{ color: 'var(--accent-secondary)', fontWeight: '600' }}>
                    Çok yakında burada hep beraber toplanacağız! ✨
                </span>
            </p>

            <div style={{
                marginTop: '40px',
                padding: '20px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                display: 'flex',
                gap: '20px',
                opacity: 0.7
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem' }}>🍿</div>
                    <div style={{ fontSize: '0.7rem', marginTop: 4 }}>Dizi Gecesi</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem' }}>🎮</div>
                    <div style={{ fontSize: '0.7rem', marginTop: 4 }}>Oyun Turnuvası</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem' }}>🍕</div>
                    <div style={{ fontSize: '0.7rem', marginTop: 4 }}>Buluşma</div>
                </div>
            </div>
        </div>
    );
}
