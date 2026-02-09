import sfx1 from '../../../assets/SFX/boardSFX1.MP3';
import sfx2 from '../../../assets/SFX/BoardSFX2.MP3';
import sfx3 from '../../../assets/SFX/BoardSFX3.MP3';

const sounds = [sfx1, sfx2, sfx3];

/**
 * Plays a random piece movement sound effect from the assets folder.
 */
export const playRandomMoveSound = () => {
    try {
        const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
        const audio = new Audio(randomSound);
        audio.volume = 0.5; // Moderate volume
        audio.play().catch(err => {
            // Browsers often block audio play until user interaction
            console.debug("Sound play blocked or failed:", err);
        });
    } catch (err) {
        console.error("Error in playRandomMoveSound:", err);
    }
};
