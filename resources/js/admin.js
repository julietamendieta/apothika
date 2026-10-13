import { createApp, nextTick, onMounted, onUnmounted, ref } from 'vue';
import axios from 'axios';

const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;

createApp({
    setup() {
        const summary = ref(null);
        const transactions = ref([]);
        const qrInput = ref('');
        const amount = ref('');
        const statusType = ref('info');
        const statusMessage = ref('Escanea el QR o ingresa el código del cliente.');
        const isScanning = ref(false);
        let scanner = null;

        const formatCurrency = (value) => new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
        }).format(Number(value ?? 0));

        const loadData = async () => {
            try {
                const [summaryResponse, transactionsResponse] = await Promise.all([
                    axios.get('/api/admin/summary'),
                    axios.get('/api/admin/transactions'),
                ]);
                summary.value = summaryResponse.data;
                transactions.value = transactionsResponse.data;
            } catch (error) {
                statusType.value = 'error';
                statusMessage.value = 'No se pudieron cargar los datos de la farmacia.';
            }
        };

        const awardPoints = async () => {
            if (!qrInput.value || amount.value === '') {
                statusType.value = 'error';
                statusMessage.value = 'Ingresa el código QR y el importe de compra.';
                return;
            }

            try {
                const response = await axios.post('/api/admin/award-points', {
                    qr_code: qrInput.value,
                    amount: Number(amount.value),
                });
                statusType.value = 'success';
                statusMessage.value = `${response.data.points_earned} puntos agregados a ${response.data.customer_name}.`;
                qrInput.value = '';
                amount.value = '';
                await loadData();
            } catch (error) {
                statusType.value = 'error';
                statusMessage.value = error.response?.data?.message ?? 'No se pudieron agregar los puntos.';
            }
        };

        const stopScanner = async () => {
            if (scanner) {
                try {
                    await scanner.stop();
                    await scanner.clear();
                } catch (error) {
                    // Camera may not have started if permission was denied.
                }
                scanner = null;
            }
            isScanning.value = false;
        };

        const startScanner = async () => {
            isScanning.value = true;
            await nextTick();

            try {
                const { Html5Qrcode } = await import('html5-qrcode');
                scanner = new Html5Qrcode('scanner');
                const cameras = await scanner.getCameras();

                if (!cameras.length) {
                    throw new Error('No camera available');
                }

                await scanner.start(
                    cameras[0].id,
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    async (decodedText) => {
                        qrInput.value = decodedText;
                        statusType.value = 'success';
                        statusMessage.value = 'Código QR leído correctamente.';
                        await stopScanner();
                    },
                    () => {},
                );
            } catch (error) {
                await stopScanner();
                statusType.value = 'error';
                statusMessage.value = 'No hay una cámara disponible. Puedes ingresar el código manualmente.';
            }
        };

        onMounted(loadData);
        onUnmounted(stopScanner);

        return {
            summary,
            transactions,
            qrInput,
            amount,
            statusType,
            statusMessage,
            isScanning,
            csrfToken,
            formatCurrency,
            awardPoints,
            startScanner,
            stopScanner,
        };
    },
    template: `
        <main class="min-h-screen bg-slate-100 px-5 py-8 sm:px-8">
            <div class="mx-auto max-w-6xl space-y-6">
                <header class="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-emerald-950 p-6 text-white">
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">APOTHIKA / Personal</p>
                        <h1 class="mt-2 text-2xl font-bold">Administración de farmacia</h1>
                    </div>
                    <form method="POST" action="/admin/logout">
                        <input type="hidden" name="_token" :value="csrfToken">
                        <button class="rounded-lg border border-white/30 px-4 py-2 text-sm font-medium hover:bg-white/10">Cerrar sesión</button>
                    </form>
                </header>
                <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
                    <section class="rounded-2xl bg-white p-6 shadow-sm">
                        <div class="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p class="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">{{ summary?.pharmacy_name ?? 'Farmacia' }}</p>
                                <h2 class="mt-2 text-xl font-bold">Registrar una compra</h2>
                            </div>
                            <div class="text-right">
                                <p class="text-xs text-slate-500">Clientes activos</p>
                                <p class="text-xl font-bold">{{ summary?.customer_count ?? 0 }}</p>
                            </div>
                        </div>
                        <div v-if="isScanning" id="scanner" class="mt-6 overflow-hidden rounded-lg bg-slate-950"></div>
                        <div v-else class="mt-6 flex min-h-24 items-center justify-between gap-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4">
                            <p class="text-sm text-slate-500">Cámara apagada</p>
                            <button @click="startScanner" class="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900">Abrir cámara</button>
                        </div>
                        <button v-if="isScanning" @click="stopScanner" class="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">Detener cámara</button>
                        <div class="mt-6 grid gap-4 sm:grid-cols-2">
                            <label class="block sm:col-span-2">
                                <span class="mb-2 block text-sm font-medium">Código QR del cliente</span>
                                <input v-model="qrInput" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-emerald-700" placeholder="Escanea o ingresa el código">
                            </label>
                            <label class="block sm:col-span-2">
                                <span class="mb-2 block text-sm font-medium">Importe de compra (ARS)</span>
                                <input v-model="amount" type="number" min="0" step="0.01" class="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-emerald-700" placeholder="Ej. 450">
                            </label>
                            <button @click="awardPoints" class="rounded-lg bg-emerald-800 px-4 py-3 font-semibold text-white hover:bg-emerald-900 sm:col-span-2">Agregar puntos</button>
                        </div>
                        <p :class="['mt-4 rounded-lg border px-4 py-3 text-sm', statusType === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : statusType === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50 text-slate-600']" role="status">{{ statusMessage }}</p>
                    </section>
                    <section class="rounded-2xl bg-white p-6 shadow-sm">
                        <div class="flex items-center justify-between gap-4">
                            <div>
                                <p class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Actividad</p>
                                <h2 class="mt-2 text-xl font-bold">Últimas compras</h2>
                            </div>
                            <p class="text-sm text-slate-500">{{ summary?.total_points ?? 0 }} puntos</p>
                        </div>
                        <div class="mt-5 divide-y divide-slate-100">
                            <article v-for="transaction in transactions" :key="transaction.id" class="flex items-center justify-between gap-3 py-4">
                                <div class="min-w-0">
                                    <p class="truncate font-medium">{{ transaction.customer_name }}</p>
                                    <p class="mt-1 text-xs text-slate-500">{{ transaction.created_at }} · {{ formatCurrency(transaction.amount) }}</p>
                                </div>
                                <p class="shrink-0 font-semibold text-emerald-800">+{{ transaction.points_earned }} pts</p>
                            </article>
                            <p v-if="transactions.length === 0" class="py-6 text-sm text-slate-500">Todavía no hay compras registradas.</p>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    `,
}).mount('#admin-app');