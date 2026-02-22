import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';
import { isAdminAuthenticated } from '../../../lib/admin-auth';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    if (!isAdminAuthenticated(request, cookies)) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401 }
      );
    }

    // Fecha actual y primer día del mes
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Ventas totales del mes (solo pedidos pagados)
    const { data: monthlySales, error: salesError } = await supabaseAdminClient
      .from('orders')
      .select('total')
      .gte('created_at', firstDayOfMonth)
      .eq('payment_status', 'paid');

    if (salesError) throw new Error(`Error ventas: ${salesError.message}`);

    const totalMonthlySales = (monthlySales || []).reduce(
      (sum, order) => sum + (parseFloat(order.total) || 0),
      0
    );

    // 2. Pedidos pendientes
    const { count: pendingOrders, error: pendingError } = await supabaseAdminClient
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (pendingError) throw new Error(`Error pendientes: ${pendingError.message}`);

    // 3. Producto más vendido (de todos los tiempos)
    const { data: orderItems, error: itemsError } = await supabaseAdminClient
      .from('order_items')
      .select('product_id, quantity');

    if (itemsError) throw new Error(`Error items: ${itemsError.message}`);

    // Agregar cantidades por producto
    const productSales: Record<string, number> = {};
    (orderItems || []).forEach((item) => {
      const pid = item.product_id;
      productSales[pid] = (productSales[pid] || 0) + (item.quantity || 1);
    });

    let topProduct = { name: 'Sin datos', quantity: 0, image_url: '' };

    const topProductId = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0];
    if (topProductId) {
      const { data: product } = await supabaseAdminClient
        .from('products')
        .select('name, image_url')
        .eq('id', topProductId[0])
        .single();

      if (product) {
        topProduct = {
          name: product.name,
          quantity: topProductId[1],
          image_url: product.image_url || '',
        };
      }
    }

    // 4. Ventas de los últimos 7 días (agrupadas por día)
    const { data: weeklyOrders, error: weeklyError } = await supabaseAdminClient
      .from('orders')
      .select('total, created_at')
      .gte('created_at', sevenDaysAgo)
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: true });

    if (weeklyError) throw new Error(`Error semanal: ${weeklyError.message}`);

    // Agrupar por día
    const dailySales: Record<string, number> = {};
    // Inicializar los 7 días con 0
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = date.toISOString().split('T')[0];
      dailySales[key] = 0;
    }

    (weeklyOrders || []).forEach((order) => {
      const day = new Date(order.created_at).toISOString().split('T')[0];
      if (dailySales[day] !== undefined) {
        dailySales[day] += parseFloat(order.total) || 0;
      }
    });

    // Formatear para el gráfico
    const chartData = Object.entries(dailySales).map(([date, total]) => {
      const d = new Date(date + 'T00:00:00');
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      return {
        day: dayNames[d.getDay()],
        date: `${d.getDate()}/${d.getMonth() + 1}`,
        total: Math.round(total * 100) / 100,
      };
    });

    // 5. Total de pedidos del mes
    const { count: monthlyOrderCount, error: monthCountError } = await supabaseAdminClient
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth)
      .eq('payment_status', 'paid');

    if (monthCountError) throw new Error(`Error conteo mensual: ${monthCountError.message}`);

    // 6. Clientes registrados totales
    const { count: totalCustomers, error: customersError } = await supabaseAdminClient
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer');

    if (customersError) throw new Error(`Error clientes: ${customersError.message}`);

    return new Response(
      JSON.stringify({
        monthlySales: Math.round(totalMonthlySales * 100) / 100,
        monthlyOrderCount: monthlyOrderCount || 0,
        pendingOrders: pendingOrders || 0,
        topProduct,
        chartData,
        totalCustomers: totalCustomers || 0,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('[Analytics API Error]', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Error desconocido' }),
      { status: 500 }
    );
  }
};
