import { UseFetchJSON } from './useFetch';
import { API_BASE } from '../urls';

type SetStateFn = (v: any) => void;

type CartItem = {
    id: number | string;
    prod_name?: string;
    purchased_qty?: number;
    [k: string]: any;
};

type ApiResp = { status: string; data?: any };

export const saveorder = async (
    first_name: string,
    last_name: string,
    country: string,
    state: string,
    shipping_method: string,
    zip_code: string,
    street: string,
    phone_no: string,
    email: string,
    reg_date: string,
    logcus: any,
    cartTot: number,
    totPrice: number,
    cartItems: CartItem[],
    customer_name: string,
    setProdSus: SetStateFn,
    setProdErr: SetStateFn,
    navigate: (path: string) => void
) => {
    const handleError = (msg: any) => setProdErr(msg);

    try {
        if (logcus) {
            // Registered customer
            if (!shipping_method || !zip_code) {
                handleError('Some fields are blank');
                return;
            }

            const cust_name = `${logcus.last_name} ${logcus.first_name}`;
            const id = logcus.id;

            const order_detail = {
                customer_id: id,
                customer_name: cust_name,
                total_items: cartTot,
                total_price: totPrice,
                shipping_method,
                zip_code,
                is_customer: true,
                is_completed: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const orderUrl = `${API_BASE}/parcel_order/order_save/${cust_name}/`;
            const res: ApiResp = await UseFetchJSON(orderUrl, 'POST', order_detail);

            if (res.status === 'success') {
                const orderId = res.data;
                if (orderId) {
                    localStorage.setItem('curOrder', String(orderId));
                    for (const prod of cartItems) {
                        const product_name = prod.prod_name;
                        const product_id = prod.id;
                        const quantity = prod.purchased_qty;
                        const order_item = {
                            order_id: orderId,
                            product_id,
                            product_name,
                            quantity,
                            is_customer: true,
                            is_completed: false,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                        const orderItemUrl = `${API_BASE}/parcel_order/order_item_save/${orderId}/${product_id}/`;
                        const saveOrderItem: ApiResp = await UseFetchJSON(orderItemUrl, 'PATCH', order_item);
                        if (saveOrderItem.status === 'success') {
                            setProdSus(saveOrderItem.data);
                        } else {
                            handleError(saveOrderItem.data ?? 'An error occured.');
                        }
                    }

                    const payment_detail = {
                        order_id: orderId,
                        customer_id: id,
                        customer_name: cust_name,
                        is_customer: true,
                        amount: totPrice,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };

                    const payUrl = `${API_BASE}/parcel_order/payment_save/${orderId}/`;
                    const savePayment = await UseFetchJSON(payUrl, 'POST', payment_detail);
                    if (savePayment.status === 'success') {
                        setProdSus(savePayment.data);
                        navigate('/payment');
                        return;
                    } else {
                        handleError(savePayment.data ?? 'An error occured');
                        return;
                    }
                }
            } else if (res.status === 'error') {
                // Try update flow
                const order_detail2 = {
                    customer_id: id,
                    customer_name: cust_name,
                    total_items: cartTot,
                    total_price: totPrice,
                    shipping_method,
                    zip_code,
                    is_customer: true,
                    is_completed: false,
                    updated_at: new Date().toISOString()
                };

                const orderUrl2 = `${API_BASE}/parcel_order/order_update/${cust_name}/`;
                const updatedOrder: ApiResp = await UseFetchJSON(orderUrl2, 'PATCH', order_detail2);
                if (updatedOrder.status === 'success') {
                    const ordId = updatedOrder.data;
                    if (ordId) {
                        localStorage.setItem('curOrder', String(ordId));
                        for (const prod of cartItems) {
                            const product_name = prod.prod_name;
                            const product_id = prod.id;
                            const quantity = prod.purchased_qty;
                            const order_item = {
                                order_id: ordId,
                                product_id,
                                product_name,
                                quantity,
                                is_customer: true,
                                is_completed: false,
                                updated_at: new Date().toISOString()
                            };
                            const ordItemUrl = `${API_BASE}/parcel_order/order_item_update/${ordId}/${product_id}/`;
                            const saveOrderItem: ApiResp = await UseFetchJSON(ordItemUrl, 'PATCH', order_item);
                            if (saveOrderItem.status === 'success') {
                                setProdSus(saveOrderItem.data);
                            } else {
                                handleError(saveOrderItem.data ?? 'An error occured');
                            }
                        }

                        const payment_detail2 = {
                            order_id: ordId,
                            customer_id: id,
                            customer_name: cust_name,
                            is_customer: true,
                            amount: totPrice,
                            updated_at: new Date().toISOString()
                        };

                        const payUrl2 = `${API_BASE}/parcel_order/payment_update/${ordId}/`;
                        const savePayment2: ApiResp = await UseFetchJSON(payUrl2, 'PATCH', payment_detail2);
                        if (savePayment2.status === 'success') {
                            setProdSus(savePayment2.data);
                            navigate('/payment');
                            return;
                        } else {
                            handleError(savePayment2.data ?? 'An error occured');
                            return;
                        }
                    }
                } else {
                    handleError(updatedOrder.data ?? 'An error occured');
                    return;
                }
            } else if (res.status === 'invalid') {
                handleError(res.data);
                return;
            } else {
                handleError('An error occured.');
                return;
            }

        } else {
            // Anonymous customer flow
            if (!first_name || !last_name || !country || !state || !shipping_method || !zip_code || !street || !phone_no || !email) {
                handleError('Some fields are blank');
                return;
            }

            const anonymous_customer = {
                first_name,
                last_name,
                country,
                state,
                street,
                zip_code,
                email,
                phone_no,
                reg_date
            };

            const anonUrl = `${API_BASE}/parcel_customer/anonymous_save/`;
            const saveAnony: ApiResp = await UseFetchJSON(anonUrl, 'POST', anonymous_customer);
            if (saveAnony.status === 'success') {
                const anaCusId = saveAnony.data;
                if (anaCusId) {
                    const order_detail = {
                        customer_id: anaCusId,
                        customer_name,
                        total_items: cartTot,
                        total_price: totPrice,
                        shipping_method,
                        zip_code,
                        is_customer: false,
                        is_completed: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    const orderUrl = `${API_BASE}/parcel_order/order_save/${customer_name}/`;
                    const saveOrder: ApiResp = await UseFetchJSON(orderUrl, 'POST', order_detail);
                    if (saveOrder.status === 'success') {
                        const anaOrdId = saveOrder.data;
                        if (anaOrdId) {
                            localStorage.setItem('curOrder', String(anaOrdId));
                            for (const prod of cartItems) {
                                const product_name = prod.prod_name;
                                const product_id = prod.id;
                                const quantity = prod.purchased_qty;
                                const order_item = {
                                    order_id: anaOrdId,
                                    product_id,
                                    product_name,
                                    quantity,
                                    is_customer: false,
                                    is_completed: false,
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString()
                                };
                                const orderItemUrl = `${API_BASE}/parcel_order/order_item_save/${anaOrdId}/${product_id}/`;
                                const saveOrderItem: ApiResp = await UseFetchJSON(orderItemUrl, 'PATCH', order_item);
                                if (saveOrderItem.status === 'success') {
                                    setProdSus(saveOrderItem.data);
                                } else {
                                    handleError(saveOrderItem.data ?? 'An error occured');
                                }
                            }

                            const payment_detail = {
                                order_id: anaOrdId,
                                customer_id: anaCusId,
                                customer_name,
                                is_customer: false,
                                amount: totPrice,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            };

                            const payUrl = `${API_BASE}/parcel_order/payment_save/${anaOrdId}/`;
                            const savePayment = await UseFetchJSON(payUrl, 'POST', payment_detail);
                            if (savePayment.status === 'success') {
                                setProdSus(savePayment.data);
                                navigate('/payment');
                                return;
                            } else {
                                handleError(savePayment.data ?? 'An error occured');
                                return;
                            }
                        }
                    } else {
                        handleError(saveOrder.data ?? 'An error occured');
                        return;
                    }
                }
            } else if (saveAnony.status === 'error') {
                const alrCusId = saveAnony.data;
                if (alrCusId) {
                    const order_detail = {
                        customer_id: alrCusId,
                        customer_name,
                        total_items: cartTot,
                        total_price: totPrice,
                        shipping_method,
                        zip_code,
                        is_customer: false,
                        is_completed: false,
                        updated_at: new Date().toISOString()
                    };
                    const ordUrl = `${API_BASE}/parcel_order/order_update/${customer_name}/`;
                    const updateOrder: ApiResp = await UseFetchJSON(ordUrl, 'PATCH', order_detail);
                    if (updateOrder.status === 'success') {
                        const ordId = updateOrder.data;
                        if (ordId) {
                            localStorage.setItem('curOrder', String(ordId));
                            for (const prod of cartItems) {
                                const product_name = prod.prod_name;
                                const product_id = prod.id;
                                const quantity = prod.purchased_qty;
                                const order_item = {
                                    order_id: ordId,
                                    product_id,
                                    product_name,
                                    quantity,
                                    is_customer: false,
                                    is_completed: false,
                                    updated_at: new Date().toISOString()
                                };
                                const orderItemUrl = `${API_BASE}/parcel_order/order_item_update/${ordId}/${product_id}/`;
                                const orderItemUpdate: ApiResp = await UseFetchJSON(orderItemUrl, 'PATCH', order_item);
                                if (orderItemUpdate.status === 'success') {
                                    setProdSus(orderItemUpdate.data);
                                } else {
                                    handleError(orderItemUpdate.data ?? 'An error occured');
                                }
                            }

                            const payment_detail = {
                                order_id: ordId,
                                customer_id: alrCusId,
                                customer_name,
                                is_customer: false,
                                amount: totPrice,
                                updated_at: new Date().toISOString()
                            };

                            const payUrl = `${API_BASE}/parcel_order/payment_save/${ordId}/`;
                            const savePayment = await UseFetchJSON(payUrl, 'PATCH', payment_detail);
                            if (savePayment.status === 'success') {
                                setProdSus(savePayment.data);
                                navigate('/payment');
                                return;
                            } else {
                                handleError(savePayment.data ?? 'An error occured');
                                return;
                            }
                        }
                    } else {
                        handleError(updateOrder.data ?? 'An error occured');
                        return;
                    }
                }
            } else {
                handleError(saveAnony.data ?? 'An error occured');
                return;
            }
        }
    } catch (err) {
        console.error(err);
        setProdErr((err as any)?.message ?? String(err));
    }
};

export default saveorder;
