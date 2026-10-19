package com.vaxcare.grpc.payment;

import com.vaxcare.feature.appointment.dto.CreatePaymentRequest;
import com.vaxcare.feature.appointment.dto.PaymentResponse;
import com.vaxcare.feature.appointment.dto.VNPayUrlResponse;
import com.vaxcare.feature.appointment.dto.ZaloPayUrlResponse;
import com.vaxcare.feature.appointment.service.PaymentService;
import com.vaxcare.grpc.common.GrpcAuthHelper;
import com.vaxcare.grpc.common.GrpcExceptionHelper;
import com.vaxcare.grpc.common.GrpcHttpSupport;
import com.vaxcare.grpc.common.GrpcProtoSupport;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.service.GrpcService;

@GrpcService
@RequiredArgsConstructor
public class PaymentGrpcService extends PaymentServiceGrpc.PaymentServiceImplBase {

    private final PaymentService paymentService;

    @Override
    public void createVnpayPaymentUrl(com.vaxcare.grpc.payment.CreatePaymentRequest request,
                                      StreamObserver<PaymentApiResponse> responseObserver) {
        try {
            Long userId = GrpcAuthHelper.requireUserId();
            if (request.getAppointmentId() <= 0) {
                throw Status.INVALID_ARGUMENT.withDescription("appointment_id is required").asRuntimeException();
            }
            CreatePaymentRequest dto = new CreatePaymentRequest();
            dto.setAppointmentId(request.getAppointmentId());
            VNPayUrlResponse url = paymentService.createVnpayPaymentUrl(userId, dto, GrpcHttpSupport.dummyRequest());
            responseObserver.onNext(PaymentApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now()).setStatus(200)
                    .setMessage("Tạo URL thanh toán VNPay thành công")
                    .setUrl(PaymentUrlResponse.newBuilder()
                            .setPaymentUrl(GrpcProtoSupport.s(url.getPaymentUrl()))
                            .setPaymentId(GrpcProtoSupport.nz(url.getPaymentId()))
                            .setTxnRef(GrpcProtoSupport.s(url.getTxnRef()))
                            .build())
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void createZalopayPaymentUrl(com.vaxcare.grpc.payment.CreatePaymentRequest request,
                                        StreamObserver<PaymentApiResponse> responseObserver) {
        try {
            Long userId = GrpcAuthHelper.requireUserId();
            if (request.getAppointmentId() <= 0) {
                throw Status.INVALID_ARGUMENT.withDescription("appointment_id is required").asRuntimeException();
            }
            CreatePaymentRequest dto = new CreatePaymentRequest();
            dto.setAppointmentId(request.getAppointmentId());
            ZaloPayUrlResponse url = paymentService.createZalopayPaymentUrl(userId, dto);
            responseObserver.onNext(PaymentApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now()).setStatus(200)
                    .setMessage("Tạo URL thanh toán ZaloPay thành công")
                    .setUrl(PaymentUrlResponse.newBuilder()
                            .setPaymentUrl(GrpcProtoSupport.s(url.getPaymentUrl()))
                            .setPaymentId(GrpcProtoSupport.nz(url.getPaymentId()))
                            .setAppTransId(GrpcProtoSupport.s(url.getAppTransId()))
                            .setOrderToken(GrpcProtoSupport.s(url.getOrderToken()))
                            .build())
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }

    @Override
    public void getPaymentByAppointment(GetPaymentByAppointmentRequest request,
                                        StreamObserver<PaymentApiResponse> responseObserver) {
        try {
            Long userId = GrpcAuthHelper.requireUserId();
            if (request.getAppointmentId() <= 0) {
                throw Status.INVALID_ARGUMENT.withDescription("appointment_id is required").asRuntimeException();
            }
            PaymentResponse p = paymentService.getPaymentByAppointment(request.getAppointmentId(), userId);
            responseObserver.onNext(PaymentApiResponse.newBuilder()
                    .setTimestamp(GrpcProtoSupport.now()).setStatus(200)
                    .setMessage("Lấy thông tin thanh toán thành công")
                    .setPayment(com.vaxcare.grpc.payment.PaymentResponse.newBuilder()
                            .setPaymentId(GrpcProtoSupport.nz(p.getPaymentId()))
                            .setAppointmentId(GrpcProtoSupport.nz(p.getAppointmentId()))
                            .setTransactionId(GrpcProtoSupport.s(p.getTransactionId()))
                            .setAmount(p.getAmount() != null ? p.getAmount().toPlainString() : "0")
                            .setPaymentMethod(p.getPaymentMethod() != null ? p.getPaymentMethod().name() : "")
                            .setStatus(p.getStatus() != null ? p.getStatus().name() : "")
                            .setPaymentTime(p.getPaymentTime() != null
                                    ? p.getPaymentTime().format(GrpcProtoSupport.ISO_DATE_TIME) : "")
                            .setCreatedAt(p.getCreatedAt() != null
                                    ? p.getCreatedAt().format(GrpcProtoSupport.ISO_DATE_TIME) : "")
                            .build())
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            GrpcExceptionHelper.handle(responseObserver, e);
        }
    }
}
