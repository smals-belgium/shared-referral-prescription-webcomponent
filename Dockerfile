FROM gcloud-docker-release.repo.gcloud.belgium.be/base-apache:3.18
COPY dist/wc-create-prescription/browser /opt/src/web-components/create-prescription
COPY dist/dist/wc-prescription-details/browser /opt/src/web-components/prescription-details
COPY dist/dist/wc-list-prescriptions/browser /opt/src/web-components/list-prescriptions
USER 1001
CMD ["run"]
