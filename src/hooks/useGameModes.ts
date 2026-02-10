import { useState, useEffect } from 'react';
import supabase from '../config/supabase';

export interface GameMode {
    game_mode_id: number;
    title: string;
    description: string | null;
    duration_minutes: number;
}

export const useGameModes = () => {
    const [gameModes, setGameModes] = useState<GameMode[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGameModes = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('game_modes')
                    .select('*')
                    .order('duration_minutes', { ascending: true });

                if (error) throw error;
                if (data) setGameModes(data);
            } catch (error) {
                console.error('Error fetching game modes:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchGameModes();
    }, []);

    const getModeByDuration = (seconds: number) => {
        const minutes = seconds / 60;
        return gameModes.find(m => m.duration_minutes === minutes);
    };

    return { gameModes, loading, getModeByDuration };
};
