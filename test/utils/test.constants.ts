const TOKEN: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFhMTBkN2M2ZTBhMzcxMjY2MTFmZDdhNSIsIm5hbWUiOiJ0ZXN0IHVzZXIiLCJyb2xlIjoiVVNFUiIsInByb3ZpZGVyIjoibG9jYWwiLCJlbWFpbCI6InVzZXJAY29udHJvbC10b3dlci5vcmciLCJleHRyYVVzZXJEYXRhIjp7ImFwcHMiOlsicnciLCJnZnciLCJnZnctY2xpbWF0ZSIsInByZXAiLCJhcXVlZHVjdCIsImZvcmVzdC1hdGxhcyIsImRhdGE0c2RncyJdfX0.R_RT47-wVCLtXNmDyfy7KGhSASUayVBW6KKsdxtphPc';

const USER: Record<string, any> = {
    id: '1a10d7c6e0a37126611fd7a5',
    name: 'test user',
    role: 'USER',
    provider: 'local',
    email: 'user@control-tower.org',
    extraUserData: {
        apps: [
            'rw',
            'gfw',
            'gfw-climate',
            'prep',
            'aqueduct',
            'forest-atlas',
            'data4sdgs'
        ]
    }
};

export default {
    TOKEN,
    USER
};
