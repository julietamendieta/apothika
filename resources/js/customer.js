import { computed, createApp, onMounted, ref } from 'vue';
import axios from 'axios';

const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

if (csrfToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}

createApp({
    setup() {
        const customer = ref(null);
        const loadError = ref(false);
        const isCheckingSession = ref(true);
        const authMode = ref('login');
        const authForm = ref({
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
        });
        const authError = ref('');
        const isSubmittingAuth = ref(false);
        const activeTab = ref('inicio');
        const selectedCoupon = ref(null);
        const selectedTip = ref(null);
        const selectedTrivia = ref(null);
        const triviaQuestionIndex = ref(0);
        const selectedTriviaAnswer = ref(null);
        const triviaScore = ref(0);
        const triviaIsComplete = ref(false);
        const triviaWasAlreadyCompleted = ref(false);
        const triviaAnswers = ref([]);
        const adviceAnswerIndex = ref(null);
        const activityCompletions = ref([]);
        const activityIsSubmitting = ref(false);
        const activitySubmissionError = ref('');
        const claimedCoupons = ref([]);
        const claimedCouponItems = computed(() => coupons.filter((coupon) => claimedCoupons.value.includes(coupon.id)));

        const coupons = [
            {
                id: 1,
                pharmacy: 'Farmacia Ferraro',
                title: '30% OFF',
                detail: 'En artículos seleccionados',
                image: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=720&q=85',
                expires: 'Válido hasta el 31 de octubre',
            },
            {
                id: 2,
                pharmacy: 'Farmacia Pilar',
                title: '2x1',
                detail: 'En perfumes seleccionados',
                image: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=720&q=85',
                expires: 'Válido hasta el 25 de octubre',
            },
            {
                id: 3,
                pharmacy: 'Farmacia Pilar',
                title: '20% OFF',
                detail: 'En cuidado personal',
                image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=720&q=85',
                expires: 'Válido hasta el 28 de octubre',
            },
            {
                id: 4,
                pharmacy: 'Farmacia del Sol',
                title: '25% OFF',
                detail: 'En protección solar',
                image: 'https://images.unsplash.com/photo-1698912198250-fb0c5ecccc6e?auto=format&fit=crop&w=720&q=85',
                expires: 'Válido hasta el 30 de noviembre',
            },
            {
                id: 5,
                pharmacy: 'Farmacia Verde',
                title: '2x1',
                detail: 'En productos para el botiquín',
                image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=720&q=85',
                expires: 'Válido hasta el 15 de noviembre',
            },
        ];

        const tips = [
            {
                id: 'sunscreen',
                title: 'Protección solar',
                points: 5,
                image: 'https://images.unsplash.com/photo-1698912198250-fb0c5ecccc6e?auto=format&fit=crop&w=500&q=85',
                introduction: 'Una buena protección solar ayuda a reducir el daño causado por la radiación UV. Combina protector solar con sombra, ropa y hábitos seguros.',
                recommendations: [
                    'Elegí un protector de amplio espectro con FPS 30 o superior.',
                    'Aplicalo antes de salir y volvé a aplicarlo cada dos horas, y después de nadar o transpirar.',
                    'Sumá sombra, anteojos de sol y ropa que cubra la piel. Ningún protector bloquea toda la radiación.',
                ],
                question: {
                    prompt: '¿Cada cuánto conviene reaplicar el protector solar?',
                    options: ['Cada dos horas y después de nadar o transpirar', 'Una vez al día', 'Solo cuando la piel se enrojece'],
                    correctIndex: 0,
                    explanation: 'Reaplicarlo cada dos horas y después de nadar o transpirar ayuda a mantener la protección.',
                },
            },
            {
                id: 'home-first-aid',
                title: 'Botiquín en casa',
                points: 5,
                image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=500&q=85',
                introduction: 'Tener un botiquín ordenado permite encontrar elementos básicos rápidamente ante una necesidad cotidiana.',
                recommendations: [
                    'Guardá gasas, vendas, curitas, guantes descartables y un termómetro en un lugar seco.',
                    'Revisá periódicamente los vencimientos y reemplazá los productos usados o dañados.',
                    'Mantenelo fuera del alcance de niños y separado de los medicamentos de uso diario.',
                ],
                question: {
                    prompt: '¿Qué hábito ayuda a mantener seguro el botiquín?',
                    options: ['Guardar todo sin revisar las fechas', 'Revisar vencimientos y reemplazar productos usados o vencidos', 'Dejarlo al alcance de niños para encontrarlo rápido'],
                    correctIndex: 1,
                    explanation: 'Revisar las fechas y reemplazar productos vencidos o usados mantiene el botiquín en condiciones.',
                },
            },
            {
                id: 'balanced-plate',
                title: 'Plato equilibrado',
                points: 5,
                image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=85',
                introduction: 'La variedad y el equilibrio en las comidas ayudan a incorporar distintos nutrientes a lo largo del día.',
                recommendations: [
                    'Incluí frutas y verduras de distintos colores en tus comidas.',
                    'Combiná vegetales con una fuente de proteínas y cereales, mejor si son integrales.',
                    'Elegí agua como bebida habitual y adaptá tus porciones a tus necesidades.',
                ],
                question: {
                    prompt: '¿Qué combinación se acerca más a un plato variado?',
                    options: ['Solo un alimento en todas las comidas', 'Vegetales, una fuente de proteínas y cereales', 'Evitar siempre frutas y verduras'],
                    correctIndex: 1,
                    explanation: 'Combinar vegetales, proteínas y cereales es una manera sencilla de sumar variedad.',
                },
            },
            {
                id: 'healthy-sleep',
                title: 'Sueño reparador',
                points: 5,
                image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=500&q=85',
                introduction: 'Una rutina regular y un ambiente tranquilo pueden ayudar a preparar el cuerpo para descansar.',
                recommendations: [
                    'Intentá acostarte y levantarte en horarios parecidos todos los días.',
                    'Bajá la intensidad de las luces y reservá unos minutos para una actividad relajante antes de dormir.',
                    'Limitá la cafeína durante la tarde y mantené el dormitorio oscuro, silencioso y cómodo.',
                ],
                question: {
                    prompt: '¿Qué rutina puede ayudar a ordenar el descanso?',
                    options: ['Cambiar el horario cada noche', 'Mantener horarios parecidos para dormir y despertar', 'Tomar bebidas con cafeína antes de acostarte'],
                    correctIndex: 1,
                    explanation: 'Un horario regular ayuda a sostener el ritmo de sueño y vigilia.',
                },
            },
            {
                id: 'safe-medicine',
                title: 'Uso seguro de medicamentos',
                points: 5,
                image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=500&q=85',
                introduction: 'Usar los medicamentos siguiendo indicaciones confiables reduce errores y ayuda a cuidar tu salud.',
                recommendations: [
                    'Leé el envase y el prospecto, y respetá la dosis y los horarios indicados.',
                    'No compartas medicamentos ni combines productos sin consultar a un profesional.',
                    'Conservalos como indica el envase, lejos del calor y del alcance de niños.',
                ],
                question: {
                    prompt: '¿Qué deberías hacer con un medicamento recetado para otra persona?',
                    options: ['No compartirlo y consultar a un profesional', 'Tomarlo si los síntomas parecen iguales', 'Duplicar la dosis para que haga efecto más rápido'],
                    correctIndex: 0,
                    explanation: 'Los medicamentos no deben compartirse; la indicación y dosis dependen de cada persona.',
                },
            },
        ];

        const trivias = [
            {
                id: 'antibiotics-myths',
                title: 'Antibióticos: mitos y verdades',
                category: 'Uso de medicamentos',
                points: 15,
                time: '2 minutos',
                image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=500&q=85',
                questions: [
                    {
                        prompt: '¿Para qué se indican los antibióticos?',
                        options: ['Para tratar algunas infecciones causadas por bacterias', 'Para curar resfríos virales', 'Para aliviar cualquier tipo de dolor'],
                        correctIndex: 0,
                        explanation: 'Los antibióticos actúan contra ciertas bacterias; no sirven para tratar virus como los que causan la mayoría de los resfríos.',
                    },
                    {
                        prompt: '¿Qué conviene hacer con antibióticos que sobraron de otro tratamiento?',
                        options: ['Guardarlos para la próxima vez', 'No reutilizarlos y consultar cómo desecharlos', 'Compartirlos con alguien con síntomas parecidos'],
                        correctIndex: 1,
                        explanation: 'Un profesional debe evaluar cada caso. No reutilices ni compartas antibióticos sobrantes.',
                    },
                    {
                        prompt: '¿Quién debe indicar si necesitás un antibiótico?',
                        options: ['Un profesional de salud', 'Cualquier persona con experiencia', 'Una búsqueda en redes sociales'],
                        correctIndex: 0,
                        explanation: 'La indicación depende de una evaluación profesional; usar antibióticos cuando no hacen falta puede causar daños.',
                    },
                ],
            },
            {
                id: 'healthy-sleep',
                title: 'Sueño y descanso saludable',
                category: 'Bienestar general',
                points: 15,
                time: '3 minutos',
                image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=500&q=85',
                questions: [
                    {
                        prompt: '¿Qué hábito puede ayudar a ordenar el descanso?',
                        options: ['Cambiar mucho el horario cada noche', 'Mantener horarios parecidos para dormir y despertar', 'Tomar café justo antes de acostarte'],
                        correctIndex: 1,
                        explanation: 'Un horario regular ayuda a sostener el ritmo de sueño y vigilia.',
                    },
                    {
                        prompt: '¿Qué ambiente suele favorecer el descanso?',
                        options: ['Un dormitorio oscuro, silencioso y cómodo', 'Una habitación muy iluminada', 'Dejar notificaciones y pantallas activas toda la noche'],
                        correctIndex: 0,
                        explanation: 'Un espacio tranquilo, oscuro y cómodo puede facilitar el descanso.',
                    },
                    {
                        prompt: '¿Qué podés probar antes de dormir?',
                        options: ['Una rutina tranquila y relajante', 'Una bebida con mucha cafeína', 'Ejercicio intenso justo al acostarte'],
                        correctIndex: 0,
                        explanation: 'Una actividad relajante puede ayudar a bajar el ritmo antes de ir a dormir.',
                    },
                ],
            },
            {
                id: 'responsible-medicines',
                title: 'Uso responsable de medicamentos',
                category: 'Uso de medicamentos',
                points: 15,
                time: '3 minutos',
                image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=500&q=85',
                questions: [
                    {
                        prompt: '¿Está bien compartir un medicamento recetado?',
                        options: ['Sí, si los síntomas se parecen', 'No, cada tratamiento es personal', 'Sí, si se reduce la dosis'],
                        correctIndex: 1,
                        explanation: 'Un medicamento indicado para una persona puede no ser adecuado para otra.',
                    },
                    {
                        prompt: 'Si tenés dudas sobre cómo tomar un medicamento, ¿qué hacés?',
                        options: ['Consultás el prospecto o a un farmacéutico o profesional de salud', 'Duplicás la próxima dosis', 'Seguís una recomendación de redes sociales'],
                        correctIndex: 0,
                        explanation: 'El prospecto y los profesionales de salud son fuentes apropiadas para resolver dudas sobre su uso.',
                    },
                    {
                        prompt: '¿Cómo conviene conservar los medicamentos?',
                        options: ['En su envase y según las indicaciones de conservación', 'En cualquier lugar, aunque haya calor o humedad', 'Fuera de su envase para tenerlos a mano'],
                        correctIndex: 0,
                        explanation: 'Seguí las indicaciones del envase y guardalos en un lugar seguro, fuera del alcance de niños.',
                    },
                ],
            },
        ];

        const selectedTriviaQuestion = computed(() => (
            selectedTrivia.value?.questions[triviaQuestionIndex.value] ?? null
        ));
        const isHomeExperience = computed(() => (
            ['inicio', 'cupones', 'consejos', 'trivias'].includes(activeTab.value)
        ));
        const pointsHistory = computed(() => {
            const purchases = (customer.value?.purchase_transactions ?? []).map((transaction) => ({
                id: `purchase-${transaction.id}`,
                label: `Compra · ${transaction.pharmacy_name}`,
                type: 'Compra',
                points_earned: transaction.points_earned,
                created_at: transaction.created_at,
            }));
            const activities = (customer.value?.activity_completions ?? [])
                .filter((completion) => completion.points_awarded > 0)
                .map((completion) => {
                    const activity = completion.activity_type === 'advice'
                        ? tips.find((tip) => tip.id === completion.activity_id)
                        : trivias.find((trivia) => trivia.id === completion.activity_id);

                    return {
                        id: `${completion.activity_type}-${completion.activity_id}`,
                        label: activity?.title ?? 'Actividad completada',
                        type: completion.activity_type === 'advice' ? 'Consejo' : 'Trivia',
                        points_earned: completion.points_awarded,
                        created_at: completion.created_at,
                    };
                });

            return [...purchases, ...activities]
                .filter((item) => item.points_earned > 0)
                .sort((first, second) => new Date(second.created_at) - new Date(first.created_at))
                .slice(0, 20);
        });

        const activityCompletionFor = (activityType, activityId) => activityCompletions.value.find(
            (completion) => completion.activity_type === activityType && completion.activity_id === activityId,
        );

        const isActivityCompleted = (activityType, activityId) => Boolean(
            activityCompletionFor(activityType, activityId),
        );

        const formatCurrency = (value) => new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
        }).format(Number(value ?? 0));

        const formatHistoryDate = (value) => new Intl.DateTimeFormat('es-AR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(value));

        const setAuthMode = (mode) => {
            authMode.value = mode;
            authError.value = '';
        };

        const loadCustomer = async () => {
            isCheckingSession.value = true;

            try {
                const response = await axios.get('/api/customer');
                customer.value = response.data;
                activityCompletions.value = response.data.activity_completions ?? [];

                try {
                    const storedClaims = JSON.parse(
                        window.localStorage.getItem(`apothika:claimed-coupons:${customer.value.id}`) ?? '[]',
                    );
                    claimedCoupons.value = Array.isArray(storedClaims)
                        ? storedClaims.filter((couponId) => coupons.some((coupon) => coupon.id === couponId))
                        : [];
                } catch (error) {
                    claimedCoupons.value = [];
                }
            } catch (error) {
                if (error.response?.status === 401) {
                    customer.value = null;
                    activityCompletions.value = [];
                } else {
                    loadError.value = true;
                }
            } finally {
                isCheckingSession.value = false;
            }
        };

        const submitAuthentication = async () => {
            isSubmittingAuth.value = true;
            authError.value = '';

            const isRegistering = authMode.value === 'register';

            try {
                await axios.post(isRegistering ? '/customer/register' : '/customer/login', {
                    ...(isRegistering ? { name: authForm.value.name } : {}),
                    email: authForm.value.email,
                    password: authForm.value.password,
                    ...(isRegistering ? { password_confirmation: authForm.value.password_confirmation } : {}),
                });

                authForm.value = { name: '', email: '', password: '', password_confirmation: '' };
                await loadCustomer();
            } catch (error) {
                const validationErrors = error.response?.data?.errors;
                const firstValidationError = validationErrors ? Object.values(validationErrors)[0]?.[0] : null;
                authError.value = firstValidationError
                    ?? error.response?.data?.message
                    ?? 'No se pudo iniciar sesión. Intentá de nuevo.';
            } finally {
                isSubmittingAuth.value = false;
            }
        };

        const logout = async () => {
            try {
                await axios.post('/customer/logout');
                customer.value = null;
                activityCompletions.value = [];
                claimedCoupons.value = [];
                activeTab.value = 'inicio';
                authMode.value = 'login';
                authError.value = '';
            } catch (error) {
                authError.value = 'No se pudo cerrar la sesión. Intentá de nuevo.';
            }
        };

        const openCoupon = (coupon) => {
            selectedTip.value = null;
            selectedTrivia.value = null;
            selectedCoupon.value = coupon;
            activeTab.value = 'cupones';
        };

        const openTip = (tip) => {
            selectedCoupon.value = null;
            selectedTrivia.value = null;
            selectedTip.value = tip;
            adviceAnswerIndex.value = null;
            activitySubmissionError.value = '';
            activeTab.value = 'consejos';
        };

        const openTrivia = (trivia) => {
            selectedCoupon.value = null;
            selectedTip.value = null;
            selectedTrivia.value = trivia;
            triviaQuestionIndex.value = 0;
            selectedTriviaAnswer.value = null;
            triviaAnswers.value = [];
            activitySubmissionError.value = '';
            const completion = activityCompletionFor('trivia', trivia.id);
            triviaScore.value = completion ? completion.points_awarded / 5 : 0;
            triviaIsComplete.value = Boolean(completion);
            triviaWasAlreadyCompleted.value = Boolean(completion);
            activeTab.value = 'trivias';
        };

        const selectTriviaAnswer = (answerIndex) => {
            if (selectedTriviaAnswer.value !== null || !selectedTriviaQuestion.value) {
                return;
            }

            selectedTriviaAnswer.value = answerIndex;
            triviaAnswers.value[triviaQuestionIndex.value] = answerIndex;

            if (answerIndex === selectedTriviaQuestion.value.correctIndex) {
                triviaScore.value += 1;
            }
        };

        const storeActivityCompletion = (completion) => {
            const existingIndex = activityCompletions.value.findIndex(
                (existing) => existing.activity_type === completion.activity_type
                    && existing.activity_id === completion.activity_id,
            );

            if (existingIndex === -1) {
                activityCompletions.value.push(completion);
            } else {
                activityCompletions.value[existingIndex] = completion;
            }
        };

        const submitActivity = async (activityType, activityId, answers) => {
            if (!customer.value || activityIsSubmitting.value) {
                return null;
            }

            activityIsSubmitting.value = true;
            activitySubmissionError.value = '';

            try {
                const response = await axios.post('/api/customer/activity-completions', {
                    qr_code: customer.value.qr_code,
                    activity_type: activityType,
                    activity_id: activityId,
                    answers,
                });

                storeActivityCompletion({
                    activity_type: response.data.activity_type,
                    activity_id: response.data.activity_id,
                    points_awarded: response.data.points_awarded,
                });
                customer.value.points_balance = response.data.points_balance;

                return response.data;
            } catch (error) {
                activitySubmissionError.value = error.response?.data?.message ?? 'No se pudo guardar tu respuesta. Intentá de nuevo.';

                return null;
            } finally {
                activityIsSubmitting.value = false;
            }
        };

        const submitAdviceAnswer = async () => {
            if (!selectedTip.value || adviceAnswerIndex.value === null || isActivityCompleted('advice', selectedTip.value.id)) {
                return;
            }

            await submitActivity('advice', selectedTip.value.id, [adviceAnswerIndex.value]);
        };

        const continueTrivia = async () => {
            if (!selectedTrivia.value || selectedTriviaAnswer.value === null) {
                return;
            }

            if (triviaQuestionIndex.value === selectedTrivia.value.questions.length - 1) {
                const completion = await submitActivity('trivia', selectedTrivia.value.id, triviaAnswers.value);

                if (completion) {
                    triviaScore.value = completion.points_awarded / 5;
                    triviaWasAlreadyCompleted.value = completion.already_completed;
                    triviaIsComplete.value = true;
                }

                return;
            }

            triviaQuestionIndex.value += 1;
            selectedTriviaAnswer.value = null;
        };

        const changeTab = (tab) => {
            activeTab.value = tab;
            selectedCoupon.value = null;
            selectedTip.value = null;
            selectedTrivia.value = null;
            adviceAnswerIndex.value = null;
            triviaQuestionIndex.value = 0;
            selectedTriviaAnswer.value = null;
            triviaAnswers.value = [];
            triviaScore.value = 0;
            triviaIsComplete.value = false;
            triviaWasAlreadyCompleted.value = false;
            activitySubmissionError.value = '';
        };

        const goBack = () => {
            if (selectedCoupon.value) {
                selectedCoupon.value = null;
                return;
            }

            changeTab('inicio');
        };

        const claimCoupon = () => {
            if (selectedCoupon.value && !claimedCoupons.value.includes(selectedCoupon.value.id)) {
                claimedCoupons.value.push(selectedCoupon.value.id);

                try {
                    window.localStorage.setItem(
                        `apothika:claimed-coupons:${customer.value.id}`,
                        JSON.stringify(claimedCoupons.value),
                    );
                } catch (error) {
                    // Keep this session usable when browser storage is unavailable.
                }
            }
        };

        const couponRedemptionCode = (coupon) => `APOTHIKA-${customer.value.id}-COUPON-${coupon.id}`;

        const couponQrUrl = (coupon) => (
            `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(couponRedemptionCode(coupon))}`
        );

        onMounted(loadCustomer);

        return {
            customer,
            loadError,
            isCheckingSession,
            authMode,
            authForm,
            authError,
            isSubmittingAuth,
            activeTab,
            isHomeExperience,
            pointsHistory,
            selectedCoupon,
            selectedTip,
            selectedTrivia,
            selectedTriviaQuestion,
            adviceAnswerIndex,
            triviaQuestionIndex,
            selectedTriviaAnswer,
            triviaScore,
            triviaIsComplete,
            triviaWasAlreadyCompleted,
            activityCompletions,
            activityIsSubmitting,
            activitySubmissionError,
            claimedCoupons,
            claimedCouponItems,
            coupons,
            tips,
            trivias,
            formatCurrency,
            formatHistoryDate,
            setAuthMode,
            submitAuthentication,
            logout,
            openCoupon,
            openTip,
            openTrivia,
            activityCompletionFor,
            isActivityCompleted,
            selectTriviaAnswer,
            submitAdviceAnswer,
            continueTrivia,
            changeTab,
            goBack,
            claimCoupon,
            couponRedemptionCode,
            couponQrUrl,
        };
    },
    template: `
        <div class="customer-shell">
            <header class="customer-header">
                <button v-if="selectedCoupon || selectedTip || selectedTrivia" class="brand-mark" aria-label="Volver" @click="goBack">
                    <svg viewBox="0 0 24 24" fill="none"><path d="m15 18-6-6 6-6M9 12h11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
                <span class="brand-name">APOTHIKA</span>
                <button v-if="customer" class="header-profile" aria-label="Abrir perfil" @click="changeTab('perfil')">
                    <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M7.5 18c.7-2.3 2.2-3.5 4.5-3.5s3.8 1.2 4.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                </button>
            </header>

            <p v-if="loadError" role="alert" class="load-message">No pudimos cargar tu cuenta. Inténtalo de nuevo más tarde.</p>
            <div v-else-if="isCheckingSession" class="loading-state">Cargando...</div>
            <main v-else-if="!customer" class="auth-screen">
                <section class="auth-card">
                    <div class="auth-brand-mark" aria-hidden="true">
                        <svg viewBox="0 0 28 28" fill="none"><path d="M14 23V12m0 6C8 18 5 14 5 8c6 0 9 3 9 10Zm0-4c0-6 3-9 9-9 0 6-3 9-9 9Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                    <p class="eyebrow">APOTHIKA</p>
                    <h1>{{ authMode === 'login' ? 'Tu bienestar, más cerca' : 'Crear cuenta' }}</h1>
                    <p class="auth-subtitle">{{ authMode === 'login' ? 'Ingresá para ver tus puntos y beneficios.' : 'Registrate para empezar a sumar puntos.' }}</p>
                    <form class="auth-form" @submit.prevent="submitAuthentication">
                        <label v-if="authMode === 'register'" class="auth-field">
                            <span>Nombre</span>
                            <input v-model="authForm.name" type="text" autocomplete="name" required maxlength="255" placeholder="Tu nombre">
                        </label>
                        <label class="auth-field">
                            <span>Correo electrónico</span>
                            <input v-model="authForm.email" type="email" autocomplete="email" required placeholder="nombre@correo.com">
                        </label>
                        <label class="auth-field">
                            <span>Contraseña</span>
                            <input v-model="authForm.password" type="password" :autocomplete="authMode === 'login' ? 'current-password' : 'new-password'" required :minlength="authMode === 'register' ? 8 : undefined" placeholder="Tu contraseña">
                        </label>
                        <label v-if="authMode === 'register'" class="auth-field">
                            <span>Confirmar contraseña</span>
                            <input v-model="authForm.password_confirmation" type="password" autocomplete="new-password" required minlength="8" placeholder="Repetí tu contraseña">
                        </label>
                        <p v-if="authError" class="auth-error" role="alert">{{ authError }}</p>
                        <button class="auth-submit" type="submit" :disabled="isSubmittingAuth">
                            {{ isSubmittingAuth ? 'Un momento...' : authMode === 'login' ? 'Iniciar sesión' : 'Crear cuenta' }}
                        </button>
                    </form>
                    <button class="auth-mode-switch" type="button" @click="setAuthMode(authMode === 'login' ? 'register' : 'login')">
                        {{ authMode === 'login' ? '¿Todavía no tenés cuenta? Registrate' : '¿Ya tenés cuenta? Iniciá sesión' }}
                    </button>
                </section>
            </main>
            <main v-else-if="customer" class="customer-content">
                <section v-if="activeTab === 'inicio'" class="screen-enter home-feed">
                    <section class="feed-section coupon-band">
                        <div class="section-heading light-heading">
                            <h1>Cupones</h1>
                        </div>
                        <div class="horizontal-list coupon-list">
                            <button v-for="coupon in coupons" :key="coupon.id" class="coupon-card" @click="openCoupon(coupon)">
                                <img :src="coupon.image" :alt="coupon.pharmacy" loading="lazy">
                                <div class="coupon-copy">
                                    <p class="coupon-offer">{{ coupon.title }}</p>
                                    <p class="coupon-pharmacy">{{ coupon.pharmacy }}</p>
                                    <p class="coupon-detail">{{ coupon.detail }}</p>
                                </div>
                            </button>
                        </div>
                    </section>

                    <section class="feed-section tips-band">
                        <div class="section-heading light-heading">
                            <h2>Consejos</h2>
                        </div>
                        <div class="horizontal-list tip-list">
                            <button v-for="tip in tips" :key="tip.title" class="tip-card" @click="openTip(tip)">
                                <img :src="tip.image" :alt="tip.title" loading="lazy">
                                <span class="tip-copy">
                                    <span class="tip-title">{{ tip.title }}</span>
                                    <span class="tip-points">{{ isActivityCompleted('advice', tip.id) ? 'Leído' : tip.points + ' puntos' }}</span>
                                </span>
                            </button>
                        </div>
                    </section>

                    <section class="feed-section trivia-band">
                        <div class="section-heading light-heading">
                            <h2>Trivias</h2>
                        </div>
                        <div class="trivia-list">
                            <button v-for="trivia in trivias" :key="trivia.title" class="trivia-row" @click="openTrivia(trivia)">
                                <img :src="trivia.image" :alt="trivia.title" loading="lazy">
                                <span class="trivia-copy">
                                    <strong>{{ trivia.title }}</strong>
                                    <small>Categoría: {{ trivia.category }}</small>
                                    <span class="trivia-meta"><span>◉ {{ isActivityCompleted('trivia', trivia.id) ? 'Completada' : trivia.points + ' pts máx.' }}</span><span>◷ {{ trivia.time }}</span></span>
                                </span>
                                <svg class="row-arrow" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>
                            </button>
                        </div>
                    </section>
                </section>

                <section v-else-if="activeTab === 'cupones'" class="screen-enter detail-page">
                    <template v-if="selectedCoupon">
                        <article class="coupon-detail-card">
                            <div class="detail-pharmacy"><span class="pharmacy-dot"></span>{{ selectedCoupon.pharmacy }}</div>
                            <img class="detail-image" :src="selectedCoupon.image" :alt="selectedCoupon.pharmacy" fetchpriority="high">
                            <div class="detail-copy">
                                <p class="detail-offer">{{ selectedCoupon.title }}</p>
                                <h1>{{ selectedCoupon.detail }}</h1>
                                <p>Presentando este cupón, obtendrás {{ selectedCoupon.title }} de descuento en productos seleccionados.</p>
                                <p class="expiry-note">{{ selectedCoupon.expires }}</p>
                                <button class="claim-button" :disabled="claimedCoupons.includes(selectedCoupon.id)" @click="claimCoupon">
                                    {{ claimedCoupons.includes(selectedCoupon.id) ? 'Reclamado' : 'Reclamar' }}
                                </button>
                            </div>
                        </article>
                    </template>
                    <template v-else>
                        <div class="page-heading">
                            <p class="eyebrow">Beneficios para vos</p>
                            <h1>Cupones disponibles</h1>
                        </div>
                        <div class="coupon-grid">
                            <button v-for="coupon in coupons" :key="coupon.id" class="coupon-card coupon-card-large" @click="openCoupon(coupon)">
                                <img :src="coupon.image" :alt="coupon.pharmacy" loading="lazy">
                                <div class="coupon-copy">
                                    <p class="coupon-offer">{{ coupon.title }}</p>
                                    <p class="coupon-pharmacy">{{ coupon.pharmacy }}</p>
                                    <p class="coupon-detail">{{ coupon.detail }}</p>
                                </div>
                            </button>
                        </div>
                    </template>
                </section>

                <section v-else-if="activeTab === 'consejos' && selectedTip" class="screen-enter detail-page advice-detail-page">
                    <button class="back-link" @click="goBack">
                        <svg viewBox="0 0 24 24" fill="none"><path d="m15 18-6-6 6-6M9 12h11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        Inicio
                    </button>
                    <article class="advice-detail-card">
                        <img :src="selectedTip.image" :alt="selectedTip.title" fetchpriority="high">
                        <div class="advice-detail-copy">
                            <p class="eyebrow">Consejo de bienestar</p>
                            <h1>{{ selectedTip.title }}</h1>
                            <p class="advice-introduction">{{ selectedTip.introduction }}</p>
                            <h2>Para tener en cuenta</h2>
                            <ul>
                                <li v-for="recommendation in selectedTip.recommendations" :key="recommendation">{{ recommendation }}</li>
                            </ul>
                            <p class="advice-disclaimer">Esta información es general y no reemplaza la orientación de un profesional de salud.</p>
                            <section v-if="activityCompletionFor('advice', selectedTip.id)" class="activity-completion-state" role="status">
                                <strong>{{ activityCompletionFor('advice', selectedTip.id).points_awarded > 0 ? '¡Sumaste 3 puntos!' : 'Consejo completado' }}</strong>
                                <p>{{ activityCompletionFor('advice', selectedTip.id).points_awarded > 0 ? 'Tu respuesta fue correcta.' : 'Tu respuesta quedó registrada. Este consejo no se puede responder otra vez.' }}</p>
                            </section>
                            <section v-else class="advice-question-panel">
                                <p class="eyebrow">Pregunta rápida · 3 puntos</p>
                                <h2 class="quiz-question">{{ selectedTip.question.prompt }}</h2>
                                <div class="quiz-options">
                                    <button
                                        v-for="(option, index) in selectedTip.question.options"
                                        :key="option"
                                        :class="['quiz-option', { 'is-selected': adviceAnswerIndex === index }]"
                                        :disabled="activityIsSubmitting"
                                        :aria-pressed="adviceAnswerIndex === index"
                                        @click="adviceAnswerIndex = index"
                                    >
                                        <span>{{ String.fromCharCode(65 + index) }}</span>
                                        {{ option }}
                                    </button>
                                </div>
                                <p v-if="activitySubmissionError" class="quiz-error" role="alert">{{ activitySubmissionError }}</p>
                                <button class="quiz-primary-button" :disabled="adviceAnswerIndex === null || activityIsSubmitting" @click="submitAdviceAnswer">
                                    {{ activityIsSubmitting ? 'Guardando respuesta...' : 'Responder y completar consejo' }}
                                </button>
                            </section>
                        </div>
                    </article>
                </section>

                <section v-else-if="activeTab === 'trivias' && selectedTrivia" class="screen-enter detail-page trivia-quiz-page">
                    <button class="back-link" @click="goBack">
                        <svg viewBox="0 0 24 24" fill="none"><path d="m15 18-6-6 6-6M9 12h11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        Inicio
                    </button>
                    <article class="quiz-card">
                        <template v-if="triviaIsComplete">
                            <div class="quiz-result">
                                <div class="quiz-result-mark" aria-hidden="true">✓</div>
                                <p class="eyebrow">{{ triviaWasAlreadyCompleted ? 'Trivia ya completada' : 'Trivia completa' }}</p>
                                <h1>{{ selectedTrivia.title }}</h1>
                                <p class="quiz-score">{{ triviaScore }} de {{ selectedTrivia.questions.length }} respuestas correctas</p>
                                <p class="quiz-result-note">{{ activityCompletionFor('trivia', selectedTrivia.id)?.points_awarded ?? 0 }} puntos sumados. Esta trivia no se puede responder otra vez.</p>
                                <button class="quiz-primary-button" @click="goBack">Volver al inicio</button>
                            </div>
                        </template>
                        <template v-else-if="selectedTriviaQuestion">
                            <img class="quiz-image" :src="selectedTrivia.image" :alt="selectedTrivia.title" fetchpriority="high">
                            <div class="quiz-content">
                                <p class="eyebrow">{{ selectedTrivia.category }}</p>
                                <h1>{{ selectedTrivia.title }}</h1>
                                <div class="quiz-progress-row">
                                    <span>Pregunta {{ triviaQuestionIndex + 1 }} de {{ selectedTrivia.questions.length }}</span>
                                    <span>{{ triviaScore }} correctas</span>
                                </div>
                                <div class="quiz-progress-track">
                                    <span :style="{ width: ((triviaQuestionIndex + 1) / selectedTrivia.questions.length * 100) + '%' }"></span>
                                </div>
                                <h2 class="quiz-question">{{ selectedTriviaQuestion.prompt }}</h2>
                                <div class="quiz-options">
                                    <button
                                        v-for="(option, index) in selectedTriviaQuestion.options"
                                        :key="option"
                                        :class="['quiz-option', {
                                            'is-correct': selectedTriviaAnswer !== null && index === selectedTriviaQuestion.correctIndex,
                                            'is-incorrect': selectedTriviaAnswer === index && index !== selectedTriviaQuestion.correctIndex,
                                        }]"
                                        :disabled="selectedTriviaAnswer !== null"
                                        :aria-pressed="selectedTriviaAnswer === index"
                                        @click="selectTriviaAnswer(index)"
                                    >
                                        <span>{{ String.fromCharCode(65 + index) }}</span>
                                        {{ option }}
                                    </button>
                                </div>
                                <div v-if="selectedTriviaAnswer !== null" :class="['quiz-feedback', selectedTriviaAnswer === selectedTriviaQuestion.correctIndex ? 'is-correct' : 'is-incorrect']" role="status">
                                    <strong>{{ selectedTriviaAnswer === selectedTriviaQuestion.correctIndex ? '¡Correcto!' : 'No exactamente' }}</strong>
                                    <p>{{ selectedTriviaQuestion.explanation }}</p>
                                </div>
                                <button class="quiz-primary-button" :disabled="selectedTriviaAnswer === null" @click="continueTrivia">
                                    {{ activityIsSubmitting ? 'Guardando resultado...' : activitySubmissionError ? 'Reintentar guardado' : triviaQuestionIndex === selectedTrivia.questions.length - 1 ? 'Finalizar y sumar puntos' : 'Siguiente pregunta' }}
                                </button>
                                <p v-if="activitySubmissionError" class="quiz-error" role="alert">{{ activitySubmissionError }}</p>
                            </div>
                        </template>
                    </article>
                </section>

                <section v-else-if="activeTab === 'puntos'" class="screen-enter points-page">
                    <div class="page-heading">
                        <p class="eyebrow">Tu programa de beneficios</p>
                        <h1>Mis puntos</h1>
                    </div>
                    <section class="points-card">
                        <p>Saldo disponible</p>
                        <strong>{{ customer.points_balance }}<span>pts</span></strong>
                    </section>
                    <section class="points-summary">
                        <div><span>Compras acumuladas</span><strong>{{ formatCurrency(customer.total_spent) }}</strong></div>
                        <div><span>Farmacia asociada</span><strong>{{ customer.pharmacy?.name ?? 'APOTHIKA' }}</strong></div>
                    </section>
                    <section class="points-history">
                        <div class="points-history-heading">
                            <div>
                                <p class="eyebrow">Actividad</p>
                                <h2>Últimos puntos sumados</h2>
                            </div>
                            <span>{{ pointsHistory.length }}</span>
                        </div>
                        <article v-for="item in pointsHistory" :key="item.id" class="points-history-row">
                            <div class="points-history-copy">
                                <span class="points-history-type">{{ item.type }}</span>
                                <strong>{{ item.label }}</strong>
                                <time :datetime="item.created_at">{{ formatHistoryDate(item.created_at) }}</time>
                            </div>
                            <strong class="points-history-earned">+{{ item.points_earned }} pts</strong>
                        </article>
                        <p v-if="pointsHistory.length === 0" class="points-history-empty">Todavía no hay puntos sumados.</p>
                    </section>
                    <section class="qr-panel">
                        <div>
                            <p class="eyebrow">Identificación</p>
                            <h2>Tu código de cliente</h2>
                            <p>Presentalo en tu farmacia para sumar puntos con cada compra.</p>
                        </div>
                        <img :src="customer.qr_url" :alt="'Código QR de ' + customer.name" loading="lazy">
                        <code>{{ customer.qr_code }}</code>
                    </section>
                </section>

                <section v-else class="screen-enter profile-page">
                    <div class="profile-top">
                        <div class="profile-avatar">{{ customer.name.charAt(0) }}</div>
                        <p class="eyebrow">Mi cuenta</p>
                        <h1>{{ customer.name }}</h1>
                        <p>{{ customer.email }}</p>
                    </div>
                    <section class="profile-stats">
                        <div><strong>{{ customer.points_balance }}</strong><span>Puntos</span></div>
                        <div><strong>{{ formatCurrency(customer.total_spent) }}</strong><span>Compras</span></div>
                    </section>
                    <section class="claimed-coupons">
                        <div class="claimed-coupons-heading">
                            <div>
                                <p class="eyebrow">Beneficios</p>
                                <h2>Cupones reclamados</h2>
                            </div>
                            <span>{{ claimedCouponItems.length }}</span>
                        </div>
                        <p v-if="claimedCouponItems.length === 0" class="claimed-coupons-empty">Todavía no tenés cupones reclamados.</p>
                        <article v-for="coupon in claimedCouponItems" :key="coupon.id" class="claimed-coupon">
                            <div class="claimed-coupon-info">
                                <span class="claimed-coupon-pharmacy">{{ coupon.pharmacy }}</span>
                                <h3>{{ coupon.title }} · {{ coupon.detail }}</h3>
                                <p>{{ coupon.expires }}</p>
                                <code>{{ couponRedemptionCode(coupon) }}</code>
                            </div>
                            <img :src="couponQrUrl(coupon)" :alt="'Código QR de ' + coupon.title + ' en ' + coupon.pharmacy" loading="lazy">
                        </article>
                    </section>
                    <button class="profile-link" @click="changeTab('puntos')"><span>Mi código QR</span><span>Ver código <b>›</b></span></button>
                    <div v-if="customer.pharmacy" class="profile-pharmacy">
                        <p class="eyebrow">Tu farmacia</p>
                        <h2>{{ customer.pharmacy.name }}</h2>
                        <p>{{ customer.pharmacy.address }}</p>
                    </div>
                    <button class="customer-logout" type="button" @click="logout">Cerrar sesión</button>
                    <a href="/admin/login" class="staff-link">Acceso para farmacia</a>
                </section>
            </main>

            <nav v-if="customer" class="bottom-nav" aria-label="Navegación principal">
                <button :class="['nav-item', { active: activeTab === 'perfil' }]" @click="changeTab('perfil')" :aria-current="activeTab === 'perfil' ? 'page' : undefined">
                    <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.2" stroke="currentColor" stroke-width="1.7"/><path d="M5.8 19c.6-3.1 2.7-4.7 6.2-4.7s5.6 1.6 6.2 4.7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg><span>Perfil</span>
                </button>
                <button :class="['nav-item', { active: isHomeExperience }]" @click="changeTab('inicio')" :aria-current="isHomeExperience ? 'page' : undefined">
                    <svg viewBox="0 0 24 24" fill="none"><path d="m3.5 10 8.5-7 8.5 7v9.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V10Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 20v-6h6v6" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg><span>Inicio</span>
                </button>
                <button :class="['nav-item', { active: activeTab === 'puntos' }]" @click="changeTab('puntos')" :aria-current="activeTab === 'puntos' ? 'page' : undefined">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.2" stroke="currentColor" stroke-width="1.6"/></svg><span>Puntos</span>
                </button>
            </nav>
        </div>
    `,
}).mount('#app');