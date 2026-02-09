import sfx1 from '../../../assets/SFX/boardSFX1.MP3';
import sfx2 from '../../../assets/SFX/BoardSFX2.MP3';
import sfx3 from '../../../assets/SFX/BoardSFX3.MP3';

const soundUrls = [sfx1, sfx2, sfx3];

// Pre-create audio objects to avoid GC and speed up playback
const audioPool = soundUrls.map(url => {
    const audio = new Audio(url);
    audio.preload = 'auto';
    return audio;
});

/**
 * Plays a random piece movement sound effect from the assets folder.
 */
export const playRandomMoveSound = () => {
    try {
        const randomIndex = Math.floor(Math.random() * audioPool.length);
        const audio = audioPool[randomIndex];

        // Reset to start if already playing
        audio.currentTime = 0;
        audio.volume = 1;

        audio.play().catch(err => {
            // Log blockages but don't fail
            console.warn("Sound play failed/blocked:", err);
        });
    } catch (err) {
        console.error("Error in playRandomMoveSound:", err);
    }
};
