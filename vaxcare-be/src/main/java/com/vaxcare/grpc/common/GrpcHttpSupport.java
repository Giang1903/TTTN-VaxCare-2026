package com.vaxcare.grpc.common;

import jakarta.servlet.http.HttpServletRequest;

import java.lang.reflect.Proxy;

public final class GrpcHttpSupport {

    private GrpcHttpSupport() {}

    public static HttpServletRequest dummyRequest() {
        return (HttpServletRequest) Proxy.newProxyInstance(
                HttpServletRequest.class.getClassLoader(),
                new Class<?>[]{HttpServletRequest.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("getHeader".equals(name)) {
                        return null;
                    }
                    if ("getRemoteAddr".equals(name)) {
                        return "127.0.0.1";
                    }
                    Class<?> rt = method.getReturnType();
                    if (rt == boolean.class) return false;
                    if (rt == int.class) return 0;
                    if (rt == long.class) return 0L;
                    return null;
                });
    }
}
