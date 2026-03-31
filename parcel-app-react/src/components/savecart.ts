import { UseFetchJSON } from './useFetch';
import { API_BASE } from '../urls';

type SetStateFn = (v: any) => void;

type CartItem = { id: number | string; prod_name?: string; purchased_qty?: number; [k: string]: any };

type ApiResp = { status: string; data?: any };

export const savecart = async (
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
  setProdErr: SetStateFn
) => {
  const handleError = (m: any) => setProdErr(m);

  try {
    if (logcus) {
      if (!shipping_method || !zip_code) {
        handleError('Some fields are blank');
        return;
      }

      const cust_name = `${logcus.last_name} ${logcus.first_name}`;
      const id = logcus.id;

      const session_detail = {
        customer_id: id,
        customer_name: cust_name,
        total_items: cartTot,
        total_price: totPrice,
        shipping_method,
        zip_code,
        is_customer: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const sessUrl = `${API_BASE}/parcel_customer/cart_save/${cust_name}/`;
      const saveSession: ApiResp = await UseFetchJSON(sessUrl, 'POST', session_detail);

      if (saveSession.status === 'success') {
        const sesId = saveSession.data;
        if (sesId) {
          for (const prod of cartItems) {
            const product_name = prod.prod_name;
            const product_id = prod.id;
            const quantity = prod.purchased_qty;
            const cart_detail = {
              session_id: sesId,
              product_id,
              product_name,
              quantity,
              is_customer: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            const cartDUrl = `${API_BASE}/parcel_customer/prod_cart_save/${sesId}/${product_id}/`;
            const saveCartDetail: ApiResp = await UseFetchJSON(cartDUrl, 'POST', cart_detail);
            if (saveCartDetail.status === 'success') setProdSus(saveCartDetail.data);
            else handleError(saveCartDetail.data ?? 'An error occured.');
          }
        }
      } else if (saveSession.status === 'error') {
        const session_detail2 = {
          customer_id: id,
          customer_name: cust_name,
          total_items: cartTot,
          total_price: totPrice,
          shipping_method,
          zip_code,
          is_customer: true,
          updated_at: new Date().toISOString()
        };
        const sessUrl2 = `${API_BASE}/parcel_customer/cart_update/${cust_name}/`;
        const updatedSession: ApiResp = await UseFetchJSON(sessUrl2, 'PATCH', session_detail2);
        if (updatedSession.status === 'success') {
          const alrSesId = updatedSession.data;
          if (alrSesId) {
            for (const prod of cartItems) {
              const product_name = prod.prod_name;
              const product_id = prod.id;
              const quantity = prod.purchased_qty;
              const cart_detail = {
                session_id: alrSesId,
                product_id,
                product_name,
                quantity,
                is_customer: true,
                updated_at: new Date().toISOString()
              };
              const cartDUrl = `${API_BASE}/parcel_customer/prod_cart_update/${alrSesId}/${product_id}/`;
              const saveCartDetail: ApiResp = await UseFetchJSON(cartDUrl, 'PATCH', cart_detail);
              if (saveCartDetail.status === 'success') setProdSus(saveCartDetail.data);
              else handleError(saveCartDetail.data ?? 'An error occured.');
            }
          }
        } else handleError(updatedSession.data ?? 'An error occured.');
      } else if (saveSession.status === 'invalid') {
        handleError(saveSession.data);
      } else {
        handleError('An error occured.');
      }
    } else {
      // anonymous
      if (!first_name || !last_name || !country || !state || !shipping_method || !zip_code || !street || !phone_no || !email) {
        setProdErr('Some fields are blank');
        return;
      }

      const anonymous_customer = { first_name, last_name, country, state, street, zip_code, email, phone_no, reg_date };
      const anonUrl = `${API_BASE}/parcel_customer/anonymous_save/`;
      const saveAnony: ApiResp = await UseFetchJSON(anonUrl, 'POST', anonymous_customer);
      if (saveAnony.status === 'success') {
        const anaCusId = saveAnony.data;
        if (anaCusId) {
          const session_detail = {
            customer_id: anaCusId,
            customer_name,
            total_items: cartTot,
            total_price: totPrice,
            shipping_method,
            zip_code,
            is_customer: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          const sessUrl = `${API_BASE}/parcel_customer/cart_save/${customer_name}/`;
          const saveSession2: ApiResp = await UseFetchJSON(sessUrl, 'POST', session_detail);
          if (saveSession2.status === 'success') {
            const anaSesId = saveSession2.data;
            if (anaSesId) {
              for (const prod of cartItems) {
                const product_name = prod.prod_name;
                const product_id = prod.id;
                const quantity = prod.purchased_qty;
                const cart_detail = {
                  session_id: anaSesId,
                  product_id,
                  product_name,
                  quantity,
                  is_customer: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                const cartDUrl = `${API_BASE}/parcel_customer/prod_cart_save/${anaSesId}/${product_id}/`;
                const saveCartDetail: ApiResp = await UseFetchJSON(cartDUrl, 'POST', cart_detail);
                if (saveCartDetail.status === 'success') setProdSus(saveCartDetail.data);
                else handleError(saveCartDetail.data ?? 'An error occured.');
              }
            }
          } else handleError(saveSession2.data ?? 'An error occured');
        }
      } else if (saveAnony.status === 'error') {
        const alrCusId = saveAnony.data;
        if (alrCusId) {
          const session_detail = {
            customer_id: alrCusId,
            customer_name,
            total_items: cartTot,
            total_price: totPrice,
            shipping_method,
            zip_code,
            is_customer: false,
            updated_at: new Date().toISOString()
          };
          const ordUrl = `${API_BASE}/parcel_customer/cart_update/${customer_name}/`;
          const updateOrder: ApiResp = await UseFetchJSON(ordUrl, 'PATCH', session_detail);
          if (updateOrder.status === 'success') {
            const alrSesId = updateOrder.data;
            if (alrSesId) {
              for (const prod of cartItems) {
                const product_name = prod.prod_name;
                const product_id = prod.id;
                const quantity = prod.purchased_qty;
                const cart_detail = {
                  session_id: alrSesId,
                  product_id,
                  product_name,
                  quantity,
                  is_customer: false,
                  updated_at: new Date().toISOString()
                };
                const cartDUrl = `${API_BASE}/parcel_customer/prod_cart_update/${alrSesId}/${product_id}/`;
                const saveCartDetail: ApiResp = await UseFetchJSON(cartDUrl, 'PATCH', cart_detail);
                if (saveCartDetail.status === 'success') setProdSus(saveCartDetail.data);
                else handleError(saveCartDetail.data ?? 'An error occured');
              }
            }
          } else handleError(updateOrder.data ?? 'An error occured');
        }
      } else {
        setProdErr(saveAnony.data ?? 'An error occured');
      }
    }
  } catch (err) {
    console.error(err);
    setProdErr((err as any)?.message ?? String(err));
  }
};

export default savecart;
